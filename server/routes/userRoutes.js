// server/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

// 🔹 사용자 키워드
router.post("/:userId/keywords", userController.addUserKeyword);
router.get("/:userId/keywords", userController.getUserKeywords);
router.delete("/:userId/keywords", userController.resetUserKeywords);
router.delete("/:userId/keywords/:keywordId", userController.deleteUserKeyword);

// 🔹 사용자 최근 검색어
router.post("/:userId/recentsearch", userController.addRecentSearch);
router.get("/:userId/recentsearch", userController.getRecentSearch);
router.delete("/:userId/recentsearch", userController.resetRecentSearch);
router.delete(
  "/:userId/recentsearch/:recentsearch",
  userController.deleteRecentSearch
);

module.exports = router;
