const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// JWT 생성 함수
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 회원가입
exports.register = async (req, res) => {
  try {
    const { name, email, password, birthdate, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      birthdate,
      gender,
    });

    await newUser.save();
    res.status(201).json({ message: "회원가입 완료" });
  } catch (err) {
    res.status(500).json({ error: "회원가입 실패", detail: err.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = generateToken(user);

    res.status(200).json({ message: "로그인 성공", token, user });
  } catch (err) {
    res.status(500).json({ error: "로그인 실패", detail: err.message });
  }
};
