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
