const express = require("express");
const router = express.Router();
const likeController = require("../controller/likeController");

router.post("/:placeName/likes", likeController.addLikeToLocation);
router.get("/:placeName/likes", likeController.getLocationLikes);

module.exports = router;
