const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const SubKeyword = require("./models/SubKeyword");
const connectDB = require("./database");

require("dotenv").config(); // 반드시 최상단에서 불러오기

mongoose.set("strictQuery", false);

async function applyKeywordsToAllUsers() {
  try {
    await connectDB(); // ❗ 여기에 URI를 넘겨야 합니다

    const allSubKeywords = await SubKeyword.find({});
    const keywordData = allSubKeywords.map((sub) => ({
      subKeyword: sub._id,
      value: 0, // 모든 키워드 기본값은 0
    }));
    console.log("📌 SubKeyword 개수:", allSubKeywords.length);

    console.log("📍 User.find 실행 전");
    const allUsers = await User.find({});
    console.log("📌 사용자 수:", allUsers.length);
    for (const user of allUsers) {
      user.keywords = keywordData;
      await user.save();
      console.log(`✅ 사용자 ${user.email} 키워드 초기화 완료`);
    }

    console.log("🎉 모든 사용자에게 SubKeyword 초기화 완료");

    const savedUser = await User.findOne({ email: `${user.email}` });
    console.log("🧐 저장 후 keywords 개수:", savedUser.keywords.length);

    process.exit();
  } catch (err) {
    console.error("❌ 에러 발생:", err);
    process.exit(1);
  }
}

applyKeywordsToAllUsers();
