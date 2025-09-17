require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");

// DB 연결 함수 불러오기
const connectDB = require(path.join(__dirname, "database"));

// Location 모델 불러오기
const Location = require(path.join(__dirname, "models", "Location"));

function extractRegion(addr1) {
  const norm = String(addr1 || "").trim();
  const m = norm.match(/(충청북도|충북)\s*([가-힣]+?)(시|군|구)/);
  if (m) {
    return {
      province: "충청북도",
      sgg: m[2] + m[3],
      cityKey: m[2],
    };
  }
  const t = norm.split(" ");
  const sgg = t[1] || "";
  return {
    province: t[0] || "",
    sgg,
    cityKey: sgg.replace(/(시|군|구)$/, ""),
  };
}

(async () => {
  try {
    // ⭐ DB 연결 실행
    await connectDB();

    const docs = await Location.find({
      addr1: { $exists: true, $ne: "" },
    }).select("_id addr1");
    console.log(`총 ${docs.length}개 문서 업데이트 시도`);

    let updated = 0;
    for (const doc of docs) {
      const { province, sgg, cityKey } = extractRegion(doc.addr1);
      if (!cityKey) continue;

      const res = await Location.updateOne(
        { _id: doc._id },
        {
          $set: {
            province,
            sgg,
            cityKey,
            [`cityFlags.${cityKey}`]: true,
          },
        }
      );
      updated += res.modifiedCount;
    }

    console.log(`업데이트 완료: ${updated}개 문서`);
    mongoose.connection.close();
  } catch (e) {
    console.error(e);
    mongoose.connection.close();
  }
})();
