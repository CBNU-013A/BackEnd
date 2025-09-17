const express = require("express");
const router = express.Router();
const predictController = require("../controller/predictController");

// 프론트는 여기로 POST: /api/predict  (body: { text: "..." })
router.post("/", predictController.postPredict);

module.exports = router;
