const Location = require("../models/Location");

exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (error) {
    console.error("🚨 장소 가져오기 실패:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
};

exports.getLocationByPlaceName = async (req, res) => {
  debugPrint("getLocationByPlaceName 호출됨");
  try {
    const { placeName } = req.params;
    const location = await Location.findOne({ title: placeName });

    if (!location) {
      return res.status(404).json({ error: "장소를 찾을 수 없습니다." });
    }

    res.json(location);
  } catch (error) {
    console.error("장소 상세 정보 가져오기 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
};

exports.getLocationByPlaceID = async (req, res) => {
  console.log("getLocationByPlaceID 호출됨");
  console.log("req.params : ", req.params);

  try {
    const { placeID } = req.params;
    const location = await Location.findById(placeID);

    if (!location) {
      return res.status(404).json({ error: "장소를 찾을 수 없습니다." });
    }

    res.json(location);
  } catch (error) {
    console.error("장소 ID로 정보 가져오기 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
};

// GET /api/location/random
// 리뷰가 50개 이상인 장소에서 랜덤으로 하나 선택
exports.getRandomLocationWithReviews = async (req, res) => {
  try {
    // review 배열의 길이가 50 이상인 데이터 찾기
    const locations = await Location.aggregate([
      { $match: { review: { $exists: true, $ne: [] } } }, // review 배열이 존재하고 빈 배열이 아닌 데이터만 필터링
      { $addFields: { reviewCount: { $size: "$review" } } }, // review 배열 길이 계산
      { $match: { reviewCount: { $gte: 50 } } }, // review 길이가 50 이상인 데이터만 필터링
      { $sample: { size: 10 } }, // 랜덤 10개 선택
    ]);

    if (!locations.length) {
      return res
        .status(404)
        .json({ error: "No locations found with 50 or more reviews" });
    }

    res.json(locations); // 랜덤으로 선택된 장소 반환
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
