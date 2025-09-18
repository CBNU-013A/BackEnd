const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const auth = require("../../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.delete("/:userId/deactivate", auth, authController.deactivateUser);
module.exports = router;
