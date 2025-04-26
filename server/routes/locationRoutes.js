const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");

router.get("/all", locationController.getAllLocations);
router.get("/:placeName", locationController.getLocationByPlaceName);

module.exports = router;