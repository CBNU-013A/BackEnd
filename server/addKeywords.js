// insertKeywords.js
const mongoose = require("mongoose");
const Keyword = require("./models/Keyword"); // 상대 경로 확인 필요
const connectDB = require("./database");

const keywords = [
  "주차",
  "화장실",
  "활동",
  "시설관리",
  "혼잡도",
  "접근성",
  "편의시설",
  "가성비",
  "아이 동반",
  "노약자 동반",
  "장소",
];

async function insertKeywords() {
  try {
    await connectDB();

    const operations = keywords.map((word) => ({
      updateOne: {
        filter: { name: word },
        upsert: true,
      },
    }));

    const result = await Keyword.bulkWrite(operations);
    console.log("✅ 키워드 삽입 결과:", result);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ 오류 발생:", err);
    mongoose.connection.close();
  }
}

insertKeywords();
