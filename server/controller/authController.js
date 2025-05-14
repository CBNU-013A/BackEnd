const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔹 회원가입
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, birthdate } = req.body;

    if (!name || !email || !password || !birthdate) {
      return res.status(400).json({ error: "모든 필드를 입력하세요." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      birthdate: new Date(birthdate),
    });

    await newUser.save();

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (error) {
    console.error("회원가입 오류:", error.message);
    res.status(500).json({ error: "회원가입 실패", details: error.message });
  }
};

// 🔹 로그인
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "로그인 성공",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error.message);
    res.status(500).json({ error: "로그인 실패", details: error.message });
  }
};


