const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");

router.get("/all", locationController.getAllLocations);
//router.get("/:placeName", locationController.getLocationByPlaceName);
router.get("/id/:placeID", locationController.getLocationByPlaceID);

//리뷰 50개 이상 랜덤뿌리기
router.get("/random", locationController.getRandomLocationWithReviews);

module.exports = router;
