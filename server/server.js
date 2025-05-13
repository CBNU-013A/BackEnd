const express = require("express");
const router = express.Router();
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// require("dotenv").config({ path: "./.env" });
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const bcrypt = require("bcryptjs");
// const authRoutes = require("./routes/authRoutes");
// console.log("🔹 authRoutes 확인:", authRoutes); // ✅ 추가된 디버깅 코드
// const User = require("./models/User");
// const Keyword = require("./models/Keyword");
// const Location = require("./models/Location");

// const app = express();
// app.use(express.json());
// app.use("/api/auth", authRoutes);
// app.use(cors()); // 모든 요청을 허용
//app.use(bodyParser.json()); // JSON 요청 파싱

// 라우터 연결
const locationRoutes = require("./routes/locationRoutes");
app.use("/location", locationRoutes);

// User 회원가입 (POST)
app.post("/register", async (req, res) => {
  try {
    console.log("📌 [서버] 회원가입 요청 도착");
    console.log("📌 [서버] 요청 데이터:", req.body); // ✅ 요청 데이터 출력

    const { name, email, password, birthdate } = req.body; //🔹 서버에서 받은 요청 데이터 확인

    if (!name || !email || !password || !birthdate) {
      console.log("👿 모든 필드를 입력해야 합니다!");
      return res.status(400).json({ error: "모든 필드를 입력하세요." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("👿 이미 존재하는 이메일:", email);
      return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
    }
    // 생년월일 검증
    const parsedBirthdate = new Date(birthdate);
    if (isNaN(parsedBirthdate.getTime())) {
      console.log("👿 잘못된 생년월일 값:", birthdate);
      return res.status(400).json({ error: "유효한 생년월일을 입력하세요." });
    }

    // 비밀번호 해싱 (서버에서 처리)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      birthdate: parsedBirthdate,
    });

    await newUser.save();
    res.status(201).json({ message: "회원가입 성공!" });
  } catch (error) {
    console.error("👿 회원가입 중 오류 발생:", error.message); // 🔹 오류 메시지 출력
    res.status(500).json({ error: "회원가입 실패", details: error.message });
  }
});

// 회원가입 이메일 중복확인
app.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      console.log("👿 이메일을 입력하세요!");
      return res.status(400).json({ error: "이메일을 입력하세요." });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("👿 이미 존재하는 이메일:", email);
      return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
    }
    res.status(200).json({ message: "사용 가능한 이메일입니다." });
  } catch (error) {
    console.error("👿 이메일 중복 확인 중 오류 발생:", error.message); // 🔹 오류 메시지 출력
    res
      .status(500)
      .json({ error: "이메일 중복 확인 실패", details: error.message });
  }
});

// User Keyword 추가 (POST)
app.post("/users/:userId/keywords", async (req, res) => {
  try {
    const { userId } = req.params;
    let { keywordId } = req.body;

    console.log(
      `📌 [서버] 키워드 추가 요청 - userId: ${userId}, keywordId: ${keywordId}`
    );

    if (!keywordId) {
      console.log("🚨 [서버] keywordId가 없음!");
      return res.status(400).json({ error: "keywordId가 필요합니다." });
    }

    // 🔹 keywordId를 ObjectId로 변환 (유효성 검사 후)
    if (!mongoose.Types.ObjectId.isValid(keywordId)) {
      console.log("🚨 [서버] keywordId가 유효한 ObjectId가 아님:", keywordId);
      return res.status(400).json({ error: "유효한 keywordId가 아닙니다." });
    }
    keywordId = new mongoose.Types.ObjectId(keywordId); // ✅ 변환 추가

    const user = await User.findById(userId);
    if (!user) {
      console.log("🚨 [서버] 사용자를 찾을 수 없음:", userId);
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    if (user.keywords.includes(keywordId)) {
      console.log("⚠️ [서버] 이미 추가된 키워드:", keywordId);
      return res.status(409).json({ error: "이미 추가된 키워드입니다." });
    }

    user.keywords.push(keywordId);
    await user.save();

    console.log(`✅ [서버] 키워드 추가 성공: ${keywordId}`);
    res.status(201).json({ message: "키워드 추가 성공!", keywordId });
  } catch (error) {
    console.error("🚨 사용자 키워드 추가 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User Keyword 가져오기 (GET)
app.get("/users/:userId/keywords", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "keywords",
      "name"
    );

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // /const keywords = await Keyword.find({ userId }); //불러오기

    res.json(user.keywords);
  } catch (error) {
    console.error("👿 키워드 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User Keyword 전체 초기화 (DELETE)
app.delete("/users/:userId/keywords", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 🔹 MongoDB의 `$set` 연산자로 키워드 배열을 비웁니다.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { keywords: [] } }, // ✅ 모든 키워드 초기화
      { new: true } // 업데이트된 사용자 데이터 반환
    );

    res.json({ message: "모든 키워드 초기화 성공!", user: updatedUser });
  } catch (error) {
    console.error("🚨 사용자 키워드 초기화 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User Keyword 삭제 (DELETE)
app.delete("/users/:userId/keywords/:keywordId", async (req, res) => {
  try {
    const { userId, keywordId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 🔹 사용자의 키워드 목록에 해당 키워드가 존재하는지 확인
    if (!user.keywords.includes(keywordId)) {
      return res
        .status(404)
        .json({ error: "해당 키워드가 존재하지 않습니다." });
    }

    // 🔹 MongoDB의 `$pull` 연산자를 사용하여 키워드 삭제
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { keywords: keywordId } },
      { new: true } // ✅ 업데이트된 사용자 데이터 반환
    );
    await user.save();

    res.json({ message: "키워드 삭제 성공!", user });
  } catch (error) {
    console.error("🚨 사용자 키워드 삭제 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//  모든 키워드 반환하는 API (text & id 포함)
app.get("/keywords/all", async (req, res) => {
  try {
    const keywords = await Keyword.find({}, { name: 1 }); // ✅ _id는 기본 포함됨

    res.json(keywords); // ✅ 전체 키워드 리스트 반환 (text, _id 포함)
  } catch (error) {
    console.error("🚨 키워드 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User 최근 검색어 추가 (POST)
app.post("/users/:userId/recentsearch", async (req, res) => {
  try {
    const { userId } = req.params;
    const { query } = req.body;

    console.log(
      `📌 [서버] 최근 검색어 - userId: ${userId}, recentsearch: ${query}`
    );

    if (!query) {
      console.log("🚨 [서버] 최근 검색어 없음!");
      return res.status(400).json({ error: "검색어가 필요합니다." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("🚨 [서버] 사용자를 찾을 수 없음:", userId);
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 최근 검색어 배열에 추가 (중복 방지)
    if (!user.recentsearch.includes(query)) {
      user.recentsearch.unshift(query); // 맨 앞에 추가
      await user.save();
    }

    console.log(`✅ [서버] 최근 검색어 추가: ${query}`);
    res.status(201).json({ message: "최근 검색어 추가 성공", query });
  } catch (error) {
    console.error("🚨 최근 검색어 추가 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User 최근 검색어 삭제 (DELETE)
app.delete("/users/:userId/recentsearch/:recentsearch", async (req, res) => {
  try {
    const { userId, recentsearch } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 🔹 사용자의 키워드 목록에 해당 키워드가 존재하는지 확인
    if (!user.recentsearch.includes(recentsearch)) {
      return res
        .status(404)
        .json({ error: "해당 최근 검색어가 존재하지 않습니다." });
    }

    // 🔹 MongoDB의 `$pull` 연산자를 사용하여 키워드 삭제
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { recentsearch: recentsearch } },
      { new: true } // ✅ 업데이트된 사용자 데이터 반환
    );
    await user.save();

    res.json({ message: "최근 검색어 삭제 성공!", user });
  } catch (error) {
    console.error("🚨 최근 검색어 삭제 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User 최근 검색어 가져오기 (GET)
app.get("/users/:userId/recentsearch", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`🚨 [서버] 잘못된 ObjectId: ${userId}`);
      return res.status(400).json({ error: "유효하지 않은 사용자 ID입니다." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(user.recentsearch);
  } catch (error) {
    console.error("👿 최근 검색어 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// User 최근 검색어 전체 초기화 (DELETE)
app.delete("/users/:userId/recentsearch", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 🔹 MongoDB의 `$set` 연산자로 키워드 배열을 비웁니다.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { recentsearch: [] } }, // ✅ 모든 키워드 초기화
      { new: true } // 업데이트된 사용자 데이터 반환
    );

    res.json({ message: "최근 검색 기록 초기화 성공!", user: updatedUser });
  } catch (error) {
    console.error("🚨 사용자 키워드 초기화 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// Location 장소 정보 가져오기 (GET)
app.get("/location/all", async (req, res) => {
  try {
    const location = await Location.find(
      {},
      {
        name: 1, // 이름 포함
        id: 1, // 고유 ID 포함
        address: 1, // 주소 포함
        "location.latitude": 1, // 위도 포함
        "location.longitude": 1, // 경도 포함
        tell: 1, // 전화번호 포함
        keywords: 1, // 키워드 포함
        review: 1,
      }
    ); // ✅ _id는 기본 포함됨

    res.json(location); // ✅ 장소 정보 반환
  } catch (error) {
    console.error("🚨 장소 정보 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

app.get("/location/:placeName", async (req, res) => {
  try {
    const { placeName } = req.params;

    // ✅ URL 디코딩 (특수 문자 처리)
    const decodedPlaceName = decodeURIComponent(placeName);

    console.log(`📌 [서버] 장소 조회 요청 - placeName: ${decodedPlaceName}`);

    // ✅ 대소문자 구분 없이 일치하는 장소 검색
    const location = await Location.findOne({
      name: new RegExp(`^${decodedPlaceName}$`, "i"),
    });

    if (!location) {
      console.log("🚨 [서버] 해당 장소를 찾을 수 없음:", decodedPlaceName);
      return res.status(404).json({ error: "Location not found" });
    }

    console.log(`✅ [서버] 장소 정보 반환: ${location.name}`);
    res.json(location);
  } catch (error) {
    console.error("🚨 [서버] 장소 정보 조회 오류:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// const MONGODB_URI = process.env.MONGO_URI;
// if (!MONGODB_URI) {
//   console.error(
//     "❌ 환경변수 MONGO_URI가 설정되지 않았습니다. .env 파일을 확인하세요."
//   );
//   process.exit(1);
// }
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("MongoDB 연결 성공"))
//   .catch((err) => {
//     console.error("MongoDB 연결 실패:", err.message);
//     process.exit(1);
//   });

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
