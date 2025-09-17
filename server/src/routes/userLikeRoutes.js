const express = require("express");
const router = express.Router();
const likeController = require("../controller/likeController");

router.post("/:userId/likes", likeController.addUserLike);
router.get("/:userId/likes", likeController.getUserLikes);
router.delete("/:userId/likes", likeController.removeUserLike);

module.exports = router;
