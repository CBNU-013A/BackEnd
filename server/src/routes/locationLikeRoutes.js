const express = require("express");
const router = express.Router();
const likeController = require("../controller/likeController");

//router.post("/:locationId/likes", likeController.addLikeToLocation);
router.get("/:locationId/likes", likeController.getLocationLikes);

module.exports = router;
