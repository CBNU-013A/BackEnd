// server/src/controller/likeController.js

const User = require("../models/User");
const Location = require("../models/Location");

//사용자 좋아요 추가
exports.addUserLike = async (req, res) => {
  const { userId } = req.params;
  const { locationId } = req.body;

  // 1) 사용자 문서에 좋아요 추가
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { likes: locationId } },
    { new: true }
  );

  // 2) 장소 문서 likes 카운터 +1
  const location = await Location.findByIdAndUpdate(
    locationId,
    { $inc: { likes: 1 } },
    { new: true }
  );

  if (!location) {
    return res.status(404).json({ message: "장소 없음" });
  }

  res.status(200).json({
    message: "사용자 좋아요 추가됨",
    userLikes: undefined, // 필요 시 User.findById(userId).likes 로 채워서 반환
    locationLikes: location.likes,
  });
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

  // 1) 사용자 문서에서 좋아요 제거
  await User.findByIdAndUpdate(
    userId,
    { $pull: { likes: locationId } },
    { new: true }
  );

  // 2) 장소 문서 likes 카운터 –1
  const location = await Location.findByIdAndUpdate(
    locationId,
    { $inc: { likes: -1 } },
    { new: true }
  );
  if (!location) {
    return res.status(404).json({ message: "장소 없음" });
  }

  res.status(200).json({
    message: "사용자 좋아요 삭제됨",
    locationLikes: location.likes,
  });
};

// //장소 좋아요 추가
// exports.addLikeToLocation = async (req, res) => {
//   const { locationId } = req.params;

//   const location = await Location.findByIdAndUpdate(
//     locationId,
//     { $inc: { likes: 1 } },
//     { new: true }
//   );

//   if (!location) return res.status(404).json({ message: "장소 없음" });

//   res.status(200).json({ likes: location.likes });
// };

//장소 좋아요 수 조회
exports.getLocationLikes = async (req, res) => {
  const { locationId } = req.params;

  const location = await Location.findById(locationId);

  if (!location) return res.status(404).json({ message: "장소 없음" });

  res.status(200).json({ likes: location.likes });
};
