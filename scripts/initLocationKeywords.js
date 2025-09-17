const mongoose = require("mongoose");
const Location = require("../server/src/models/Location");
const connectDB = require("./database");

mongoose.set("strictQuery", false);

async function patchKeywordsFrequency() {
  await connectDB();

  const locations = await Location.find({ "keywords.0": { $exists: true } });

  let updatedCount = 0;

  for (const location of locations) {
    let changed = false;

    // keywords 배열을 완전히 새로 만듦
    const updatedKeywords = location.keywords.map((kw) => {
      const kwObj = kw.toObject(); // 🔍 평범한 JS 객체로 변환
      if (kwObj.frequency === undefined) {
        kwObj.frequency = 0;
        changed = true;
      }
      return kwObj;
    });

    if (changed) {
      location.set("keywords", updatedKeywords); // 🔥 전체 교체 (set으로!)
      await location.save();
      updatedCount++;
      console.log(`✅ '${location.title}' → frequency 필드 추가됨`);
    }
  }

  console.log(`🎯 총 업데이트된 문서 수: ${updatedCount}`);
  process.exit();
}

patchKeywordsFrequency();
