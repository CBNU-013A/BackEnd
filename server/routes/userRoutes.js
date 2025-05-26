// server/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

// 🔹 사용자 키워드
router.post("/:userId/keywords", userController.updateUserKeyword);
router.get("/:userId/keywords", userController.getUserKeywords);
router.patch("/:userId/keywords", userController.resetUserKeywords);
router.patch("/:userId/keywords/remove", userController.removeUserKeyword);

// 🔹 사용자 최근 검색어
router.post("/:userId/recentsearch", userController.addRecentSearch);
router.get("/:userId/recentsearch", userController.getRecentSearch);
router.delete("/:userId/recentsearch", userController.resetRecentSearch);
router.delete(
  "/:userId/recentsearch/:locationId",
  userController.deleteRecentSearch
);

module.exports = router;
