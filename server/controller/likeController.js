const User = require("../models/User");
const Location = require("../models/Location");

//사용자 좋아요 추가
exports.addUserLike = async (req, res) => {
  const { userId } = req.params;
  const { locationId } = req.body;

  await User.findByIdAndUpdate(userId, {
    $addToSet: { likes: locationId },
  });

  res.status(200).json({ message: "사용자 좋아요 추가됨" });
};

//사용자 좋아요 조회
exports.getUserLikes = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate("likes", "name address");

  res.status(200).json({ likes: user.likes });
};

//사용자 좋아요 삭제
exports.removeUserLike = async (req, res) => {
  const { userId } = req.params;
  const { locationId } = req.body;

  await User.findByIdAndUpdate(userId, {
    $pull: { likes: locationId },
  });

  res.status(200).json({ message: "사용자 좋아요 삭제됨" });
};

//장소 좋아요 추가
exports.addLikeToLocation = async (req, res) => {
  const { placeName } = req.params;

  const location = await Location.findOneAndUpdate(
    { title: placeName },
    { $inc: { likes: 1 } },
    { new: true }
  );

  if (!location) return res.status(404).json({ message: "장소 없음" });

  res.status(200).json({ likes: location.likes });
};

//장소 좋아요 수 조회
exports.getLocationLikes = async (req, res) => {
  const { placeName } = req.params;

  const location = await Location.findOne({ title: placeName });

  if (!location) return res.status(404).json({ message: "장소 없음" });

  res.status(200).json({ likes: location.likes });
};
