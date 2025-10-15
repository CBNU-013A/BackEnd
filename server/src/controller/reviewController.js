// server/src/controller/reviewController.js

const axios = require("axios");

const Review = require("../models/Review");
const Location = require("../models/Location");
const SentimentAspect = require("../models/SentimentAspect");
const Category = require("../models/Category");
const PreferenceTag = require("../models/PreferenceTag");
const { recomputeLocationAnalysis } = require("../utils/locationAnalysis");
const {
  requestLocationSummary,
  shouldTriggerSummary,
} = require("../services/locationSummary");

// ----Review Analysis----

const requestanalyzeReview = async (content) => {
  /* 감성 분석 요청 */
  try {
    console.log("리뷰 분석 시작:", content);
    const response = await axios.post(
      `${process.env.SENTIMENT_API_URL}/api/v1/predict`,
      {
        text: content,
      },
      {
        headers: {
          "nlp-api-key": `${process.env.SENTIMENT_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("리뷰 분석 결과:", response);
    return [response.data.sentiments, response.data.categories];
  } catch (err) {
    console.error("❌ 리뷰 분석 실패:", err);
    return [null, null];
  }
};

const processSentiments = async (sentiments) => {
  /* 
  감성 분석 response 후처리 
  - Aspect -> ID로 변경
  - str(pos, neg) -> 0, 1 형태로 변경
  - 배열로 반환
  */
  try {
    console.log("감성 분석 결과 처리 시작:", sentiments);
    const SentimentAspectArray = [];

    for (const [AspectName, sentiment] of Object.entries(sentiments)) {
      const AspectDoc = await SentimentAspect.findOne({ name: AspectName });
      if (!AspectDoc) {
        console.log(`Aspect를 찾을 수 없음: ${AspectName}`);
        continue;
      }

      const sentimentObj = {
        pos: sentiment === "pos" ? 1 : 0,
        neg: sentiment === "neg" ? 1 : 0,
        none: sentiment !== "pos" && sentiment !== "neg" ? 1 : 0,
      };

      SentimentAspectArray.push({
        aspect: AspectDoc._id,
        sentiment: sentimentObj,
      });
    }

    console.log("처리된 Aspect 배열:", SentimentAspectArray);
    return SentimentAspectArray;
  } catch (err) {
    console.error("❌ 감성 분석 결과 처리 실패:", err);
    return [];
  }
};

const processCategories = async (categories) => {
  /* 
  Review Model의 Categories 형식에 맞게 후처리
  */
  try {
    console.log("카테고리 분석 결과 처리 시작:", categories);
    const CategoryArray = [];

    for (const [categoryName, tagName] of Object.entries(categories)) {
      // 카테고리 ID 조회
      const categoryDoc = await Category.findOne({ name: categoryName });
      
      // DB에 카테고리 없을때 예외처리
      if (!categoryDoc) {
        console.log(`카테고리를 찾을 수 없음: ${categoryName}`);
        continue;
      }

      // 카테고리에 해당하는 태그 ID 조회
      const tagDoc = await PreferenceTag.findOne({
        name: tagName,
        category: categoryDoc._id,
      });

      // DB에 태그 없을때 예외처리
      if (!tagDoc) {
        console.log(`태그를 찾을 수 없음: ${tagName}`);
        continue;
      }

      // Review 스키마 구조
      CategoryArray.push({
        category: categoryDoc._id,
        value: {
          tag: tagDoc._id,
        },
      });
    }

    console.log("처리된 카테고리 배열:", CategoryArray);
    return CategoryArray;

  } catch (err) {
    console.error("❌ 카테고리 분석 결과 처리 실패:", err);
    return [];
  }
};

// ----Review CRUD----

exports.getReviewsByLocation = async (req, res) => {
  try {
    const locationId = req.params.locationId;

    const reviews = await Review.find({ location: locationId })
      .select("author content createdAt sentimentAspects categories")
      .populate("author", "nickname profileImage")
      .populate("sentimentAspects.aspect", "name")
      .populate("categories.category", "name")
      .populate("categories.value.tag", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "리뷰 목록 조회 성공",
      reviews,
    });
  } catch (err) {
    console.error("❌ 리뷰 조회 실패:", err);
    res.status(500).json({ error: "리뷰 조회 실패", detail: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "리뷰가 존재하지 않습니다." });
    }

    if (review.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "리뷰 삭제 권한이 없습니다." });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "리뷰 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "리뷰 삭제 실패" });
  }
  await recomputeLocationAnalysis(review.location);
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user._id;
    const content = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }
    if (review.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    // 감성 분석 수행
    const [sentiments, categories] = await requestanalyzeReview(content);
    if (!sentiments || !categories) {
      return res.status(400).json({ message: "감성 분석 실패" });
    }

    let SentimentAspectArray = [];
    SentimentAspectArray = await processSentiments(sentiments);

    let CategoryArray = [];
    CategoryArray = await processCategories(categories);

    review.content = content;
    review.sentimentAspects = SentimentAspectArray;
    review.categories = CategoryArray;
    
    await review.save();

    // Location 문서에 content string 변경
    // TODO: 추후 id로 변경
    const updatedReview = await Location.findByIdAndUpdate(
      review.location,
      { $push: { review: review.content } },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "해당 장소를 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "리뷰 수정 완료", review });
  } catch (err) {
    console.error("❌ 리뷰 수정 실패:", err);
    res.status(500).json({ error: "리뷰 수정 실패", detail: err.message });
  }
  await recomputeLocationAnalysis(review.location);
};

exports.createReview = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id;
    const locationId = req.params.locationId;

    console.log("리뷰 생성 및 장소 연결 시작 - 내용:", content);

    // 리뷰 분석 요청 및 결과 반환
    const [sentiments, categories] = await requestanalyzeReview(content);
    
    // 리뷰 분석 결과 없을때 예외처리
    if (!sentiments || !categories) {
      return res.status(400).json({ message: "리뷰 분석 실패" });
    }

    // 리뷰 분석 결과 후처리
    
    let SentimentAspectArray = [];
    SentimentAspectArray = await processSentiments(sentiments);

    let CategoryArray = [];
    CategoryArray = await processCategories(categories);
    
    console.log("리뷰 분석 완료");

    // DB에 리뷰 저장 요청
    const newReview = new Review({
      content,
      author: userId,
      location: locationId,
      sentimentAspects: SentimentAspectArray,
      categories: CategoryArray,
    });

    const savedReview = await newReview.save();
    console.log("저장된 리뷰:", savedReview);

    // DB의 Location 문서에 리뷰 추가
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      { $push: { review: content } },
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "해당 장소를 찾을 수 없습니다." });
    }
    
    // 요약 비동기 트리거(30개마다 + 일주일 간격) 근데 되는지 안되는지 모름...
    try {
      const loc = await Location.findById(locationId).select(
        "reviewCount lastSummaryAt"
      );
      if (shouldTriggerSummary(loc)) {
        requestLocationSummary(locationId).catch(() => {});
      }
    } catch (_) {}
    res.status(201).json({
      message: "리뷰 등록 및 장소에 연결 완료",
      review: savedReview,
    });

  } catch (err) {
    console.error("❌ 리뷰 저장 실패:", err);
    res.status(500).json({ error: "리뷰 저장 실패", detail: err.message });
  }
  // Location 문서에 리뷰 추가 후 종합 집계 업데이트인데 이거 왜 있지? 진짜 모름...
  await recomputeLocationAnalysis(locationId);
};

// 사용자 작성 리뷰 전체 조회
exports.getReviewsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 작성자 기준으로 모든 리뷰 불러오기
    // 필요에 따라 location, keywords 등 populate
    const reviews = await Review.find({ author: userId })
      .select("content location createdAt sentimentAspects")
      .populate("location", "title address")
      .populate("sentimentAspects.aspect", "name")
      .populate("categories.category", "name")
      .populate("categories.value.tag", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "사용자 작성 리뷰 목록 조회 성공",
      reviews,
    });
  } catch (err) {
    console.error("❌ 사용자 리뷰 조회 실패:", err);
    res
      .status(500)
      .json({ error: "사용자 리뷰 조회 실패", detail: err.message });
  }
};

/**
 * 저장 전용이 아닌, 텍스트만 주면 감성분석+후처리 결과를 바로 리턴
 */
exports.analyzeReview = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "content를 보내주세요." });
    }

    // 1) 감성 분석
    const [sentiments, categories] = await requestanalyzeReview(content);
    if (!sentiments || !categories) {
      return res.status(500).json({ message: "감성 분석 요청 실패" });
    }

    // 2) 후처리 (Keyword ID 매핑 + pos/neg 숫자 변환)
    const SentimentAspectArray = await processSentiments(sentiments);
    const CategoryArray = await processCategories(categories);

    // 3) 결과 리턴
    res.status(200).json({
      message: "감성 분석 및 키워드 처리 완료",
      rawSentiments: sentiments,
      processed: SentimentAspectArray,
      processedCategories: CategoryArray,
    });
  } catch (err) {
    console.error("❌ analyzeReview 실패:", err);
    res.status(500).json({ error: "analyzeReview 실패", detail: err.message });
  }
};

exports.requestanalyzeReview = requestanalyzeReview;
exports.processSentiments = processSentiments;
exports.processCategories = processCategories;