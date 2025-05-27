const Review = require("../models/Review");
const Location = require("../models/Location");

const axios = require("axios");

// 감성분석 API 호출 함수
async function analyzeSentiment(text) {
  try {
    const response = await axios.post(process.env.SENTIMENT_API_URL, {
      text
    }, {
      headers: {
        'nlp-api-key': `${process.env.SENTIMENT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.sentiments;
  } catch (error) {
    console.error("감성분석 API 호출 실패:", error);
    return null;
  }
}

// 감성분석 결과를 Location 키워드에 반영하는 함수
async function updateLocationKeywordSentiments(locationId, sentiments) {
  try {
    const location = await Location.findById(locationId);
    if (!location) {
      console.error("위치 정보를 찾을 수 없습니다:", locationId);
      return;
    }

    // sentiments 객체의 각 키워드에 대해
    for (const [keyword, sentiment] of Object.entries(sentiments)) {
      // 해당 키워드가 location.keywords에 있는지 확인
      let keywordObj = location.keywords.find(k => k.name === keyword);
      
      // 키워드가 없으면 새로 생성
      if (!keywordObj) {
        keywordObj = {
          name: keyword,
          sentiment: {
            none: 0,
            pos: 0,
            neg: 0,
            neu: 0,
            total: 0
          }
        };
        location.keywords.push(keywordObj);
      }

      // 감성 결과에 따라 카운트 증가
      switch(sentiment.toLowerCase()) {
        case 'pos':
          keywordObj.sentiment.pos += 1;
          break;
        case 'neg':
          keywordObj.sentiment.neg += 1;
          break;
        case 'neu':
          keywordObj.sentiment.neu += 1;
          break;
        default:
          keywordObj.sentiment.none += 1;
      }
      keywordObj.sentiment.total += 1;
    }

    await location.save();
    console.log(`✅ Location ${locationId}의 키워드 감성분석 결과가 업데이트되었습니다.`);
  } catch (error) {
    console.error("Location 키워드 업데이트 중 오류 발생:", error);
  }
}

exports.createReview = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id; // ✅ JWT에서 해석된 사용자 ID
    const locationId = req.params.locationId; // ✅ URL 경로에서 가져옴;

    const review = new Review({
      content,
      author: userId,
      location: locationId,
      sentimentAnalysis: {
        sentiments: {},
        analyzedAt: null
      }
    });

    await review.save();

    res.status(201).json({ message: "리뷰 등록 성공", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "리뷰 저장 실패" });
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

    const previousSentiments = review.sentimentAnalysis.sentiments;

    // 내용이 변경된 경우에만 감성분석 재수행
    if (content !== undefined && content !== review.content) {
      review.content = content;
      
      // 새로운 감성분석 수행
      const newSentiments = await analyzeSentiment(content);
      if (newSentiments) {
        review.sentimentAnalysis = {
          sentiments: newSentiments,
          analyzedAt: new Date()
        };

        // 이전 결과를 Location에서 제거
        if (previousSentiments) {
          const location = await Location.findById(review.location);
          if (location) {
            for (const [keyword, sentiment] of Object.entries(previousSentiments)) {
              const keywordObj = location.keywords.find(k => k.name === keyword);
              if (keywordObj) {
                switch(sentiment.toLowerCase()) {
                  case 'pos':
                    keywordObj.sentiment.pos = Math.max(0, keywordObj.sentiment.pos - 1);
                    break;
                  case 'neg':
                    keywordObj.sentiment.neg = Math.max(0, keywordObj.sentiment.neg - 1);
                    break;
                  case 'neu':
                    keywordObj.sentiment.neu = Math.max(0, keywordObj.sentiment.neu - 1);
                    break;
                  default:
                    keywordObj.sentiment.none = Math.max(0, keywordObj.sentiment.none - 1);
                }
                keywordObj.sentiment.total = Math.max(0, keywordObj.sentiment.total - 1);
              }
            }
            await location.save();
          }
        }

        // 새로운 결과 반영
        await updateLocationKeywordSentiments(review.location, newSentiments);
      }
    }

    await review.save();
    res.status(200).json({ message: "리뷰 수정 완료", review });
  } catch (err) {
    console.error("❌ 리뷰 수정 실패:", err);
    res.status(500).json({ error: "리뷰 수정 실패", detail: err.message });
  }
};

exports.createReviewAndLinkToLocation = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id;
    const locationId = req.params.locationId;

    // ✅ 리뷰 저장
    const newReview = new Review({
      content,
      author: userId,
      location: locationId,
    });

    const savedReview = await newReview.save();

    // Location 문서에 content 자체를 push
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      { $push: { review: content } }, // 🔥 내용 자체 저장
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
