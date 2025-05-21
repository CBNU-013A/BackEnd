const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "토큰 없음" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "유효하지 않은 사용자" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "인증 실패", error: error.message });
  }
};

module.exports = authMiddleware;
