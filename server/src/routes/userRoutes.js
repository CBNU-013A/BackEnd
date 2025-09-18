// server/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const likeController = require("../controller/likeController");

// 🔹 사용자 키워드
// router.post("/:userId/keywords", userController.updateUserKeyword);
// router.get("/:userId/keywords", userController.getUserKeywords);
// router.patch("/:userId/keywords", userController.resetUserKeywords);
// router.patch("/:userId/keywords/remove", userController.removeUserKeyword);

// 🔹 사용자 최근 검색어
router.post("/:userId/recentsearch", userController.addRecentSearch);
router.get("/:userId/recentsearch", userController.getRecentSearch);
router.delete("/:userId/recentsearch", userController.resetRecentSearch);
router.delete(
  "/:userId/recentsearch/:locationId",
  userController.deleteRecentSearch
);

// 사용자 선호 저장
router.post("/:userId/preferences", userController.setPreferences);

// ⭐️ 새로 추가: 감성 키워드 선호
router.post(
  "/:userId/keyword-preferences",
  userController.setKeywordPreferences
);
router.get(
  "/:userId/keyword-preferences",
  userController.getKeywordPreferences
);

router.post("/:userId/likes", likeController.addUserLike);
router.get("/:userId/likes", likeController.getUserLikes);
router.delete("/:userId/likes", likeController.removeUserLike);

module.exports = router;
