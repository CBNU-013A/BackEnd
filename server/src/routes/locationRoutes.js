const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");
const likeController = require("../controller/likeController");

router.get("/all", locationController.getAllLocations);
//router.get("/:placeName", locationController.getLocationByPlaceName);
router.get("/id/:placeID", locationController.getLocationByPlaceID);

//리뷰 50개 이상 랜덤뿌리기
router.get("/random", locationController.getRandomLocationWithReviews);

// 도시 필터 검색 (도시 비어있으면 11개 전체)
router.post("/filter", locationController.filterByCities);

//router.post("/:locationId/likes", likeController.addLikeToLocation);
router.get("/:locationId/likes", likeController.getLocationLikes);

module.exports = router;
