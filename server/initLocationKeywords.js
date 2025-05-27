const mongoose = require("mongoose");
const Location = require("./models/Location");
const SubKeyword = require("./models/SubKeyword");
const connectDB = require("./database");

mongoose.set("strictQuery", false);

async function ensureKeywordsField() {
  try {
    await connectDB();

    const subKeywords = await SubKeyword.find({});
    const keywordTemplate = subKeywords.map((sub) => ({
      subKeyword: sub._id,
      positive: 0,
      negative: 0,
    }));

    // keywords 필드가 없거나 비어 있는 문서만 찾음
    const locations = await Location.find({
      $or: [
        { keywords: { $exists: false } },
        { keywords: { $size: 0 } },
        { "keywords.0.positive": { $exists: false } },
      ],
    });

    console.log(`🛠 업데이트할 문서 수: ${locations.length}`);

    for (const location of locations) {
      location.keywords = keywordTemplate; // keywords 필드 생성 및 추가
      await location.save();
      console.log(`✅ '${location.title}' → keywords 필드 추가 완료`);
    }

    console.log("🎉 모든 누락 문서에 keywords 필드 추가 및 초기화 완료");
    process.exit();
  } catch (err) {
    console.error("❌ 처리 중 에러 발생:", err);
    process.exit(1);
  }
}

ensureKeywordsField();
