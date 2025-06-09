const Review = require("../models/Review");
const Location = require("../models/Location");
const axios = require("axios");
const Keyword = require("../models/Keyword");

const requestanalyzeReview = async (content) => {
  try {
    console.log("감성 분석 시작:", content);
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
    console.log("감성 분석 결과:", response.data);
    return response.data.sentiments;
  } catch (err) {
    console.error("❌ 리뷰 분석 실패:", err);
    return null;
  }
};

const processSentiments = async (sentiments) => {
  try {
    console.log("감성 분석 결과 처리 시작:", sentiments);
    const keywordArray = [];

    for (const [keywordName, sentiment] of Object.entries(sentiments)) {
      const keywordDoc = await Keyword.findOne({ name: keywordName });
      if (!keywordDoc) {
        console.log(`키워드를 찾을 수 없음: ${keywordName}`);
        continue;
      }

      const sentimentObj = {
        pos: sentiment === "pos" ? 1 : 0,
        neg: sentiment === "neg" ? 1 : 0,
      };

      keywordArray.push({
        keyword: keywordDoc._id,
        sentiment: sentimentObj,
      });
    }

    console.log("처리된 키워드 배열:", keywordArray);
    return keywordArray;
  } catch (err) {
    console.error("❌ 감성 분석 결과 처리 실패:", err);
    return [];
  }
};

exports.getReviewsByLocation = async (req, res) => {
  try {
    const locationId = req.params.locationId;

    const reviews = await Review.find({ location: locationId }).select(
      "author content"
    );

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
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user._id;
    const { content } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }

    if (review.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    if (content !== undefined) {
      review.content = content;

      // 내용이 수정된 경우 감성 분석 다시 수행
      const sentiments = await requestanalyzeReview(content);
      if (sentiments) {
        const keywordArray = await processSentiments(sentiments);
        review.keywords = keywordArray;
      }
    }

    await review.save();

    res.status(200).json({ message: "리뷰 수정 완료", review });
  } catch (err) {
    console.error("❌ 리뷰 수정 실패:", err);
    res.status(500).json({ error: "리뷰 수정 실패", detail: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id;
    const locationId = req.params.locationId;

    console.log("리뷰 생성 및 장소 연결 시작 - 내용:", content);

    // 감성 분석 수행
    const sentiments = await requestanalyzeReview(content);
    let keywordArray = [];

    if (sentiments) {
      console.log("감성 분석 결과 받음:", sentiments);
      keywordArray = await processSentiments(sentiments);
    }

    // 리뷰 저장
    const newReview = new Review({
      content,
      author: userId,
      location: locationId,
      keywords: keywordArray,
    });

    const savedReview = await newReview.save();
    console.log("저장된 리뷰:", savedReview);

    // Location 문서에 content string push
    // TODO: 추후 id로 변경?
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      { $push: { review: content } },
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "해당 장소를 찾을 수 없습니다." });
    }

    res.status(201).json({
      message: "리뷰 등록 및 장소에 연결 완료",
      review: savedReview,
    });
  } catch (err) {
    console.error("❌ 리뷰 저장 실패:", err);
    res.status(500).json({ error: "리뷰 저장 실패", detail: err.message });
  }
};

// 사용자 작성 리뷰 전체 조회
exports.getReviewsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 작성자 기준으로 모든 리뷰 불러오기
    // 필요에 따라 location, keywords 등 populate
    const reviews = await Review.find({ author: userId })
      .select("content location createdAt keywords")
      .populate("location", "title address") // 장소 정보
      .populate("keywords.keyword", "name"); // 감성 키워드 이름

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
