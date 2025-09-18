require("dotenv").config();
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");

const connectDB = require(path.join(__dirname, "database"));
const Location = require(path.join(__dirname, "../server/src/models/Location"));

function createClient() {
  const baseURL = process.env.NLP_BASE_URL || process.env.SENTIMENT_API_URL || "";
  const apiKey = process.env.NLP_API_KEY || process.env.SENTIMENT_API_KEY || "";
  return axios.create({
    baseURL,
    headers: { "nlp-api-key": apiKey, "Content-Type": "application/json" },
    timeout: 60000,
  });
}

async function summarizeOverview(locationDoc) {
  const client = createClient();
  const endpoint = process.env.NLP_OVERVIEW_ENDPOINT || "/api/v1/summarize/overview";
  const payload = { Overview: locationDoc.overview || "" };
  const res = await client.post(endpoint, payload);
  const data = res?.data;
  return typeof data === "string" ? data : (data?.summary || "");
}

async function main() {
  await connectDB();

  const limit = Number(process.env.SUMMARIZE_OVERVIEW_LIMIT || 0); // 0 = all
  const onlyEmpty = String(process.env.SUMMARIZE_ONLY_EMPTY || "true").toLowerCase() !== "false";

  const query = {
    overview: { $exists: true, $ne: "" },
  };
  if (onlyEmpty) {
    query.llmoverview = { $in: [null, ""] }; // null also matches non-existent
  }

  let processed = 0;
  const cursor = Location.find(query).select("_id title overview llmoverview").cursor();
  try {
    for await (const loc of cursor) {
      if (limit && processed >= limit) break;
      try {
        const summary = await summarizeOverview(loc);
        if (!summary) {
          console.warn(`⚠️ 요약 실패 또는 빈 응답: ${loc._id} (${loc.title})`);
          continue;
        }
        await Location.updateOne({ _id: loc._id }, { $set: { llmoverview: summary } });
        processed++;
        if (processed % 20 === 0) {
          console.log(`✅ 진행상황: ${processed}개 요약 저장`);
        }
      } catch (e) {
        console.error(`❌ 실패: ${loc._id} (${loc.title})`, e?.response?.data || e.message);
      }
    }
    console.log(`🏁 완료. 저장된 요약 수: ${processed}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("스크립트 오류:", err);
    process.exit(1);
  });
}


