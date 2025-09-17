const axios = require("axios");
const Location = require("../models/Location");
const Review = require("../models/Review");

function createClient() {
  const baseURL = process.env.NLP_BASE_URL || process.env.SENTIMENT_API_URL || "";
  const apiKey = process.env.NLP_API_KEY || process.env.SENTIMENT_API_KEY || "";
  return axios.create({
    baseURL,
    headers: {
      "nlp-api-key": apiKey,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });
}

function shouldTriggerSummary(doc, now = new Date()) {
  const count = Number(doc?.reviewCount || 0);
  const last = doc?.lastSummaryAt ? new Date(doc.lastSummaryAt) : null;
  const batchSize = Number(process.env.SUMMARY_BATCH_SIZE || 30);
  const intervalDays = Number(process.env.SUMMARY_MIN_INTERVAL_DAYS || 7);
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const intervalOk = !last || (now - last) >= intervalMs;
  const batchOk = count > 0 && count % batchSize === 0;
  return batchOk && intervalOk;
}

async function requestLocationSummary(locationId, limit = Number(process.env.SUMMARY_REVIEW_LIMIT || 50)) {
  const client = createClient();
  // 리뷰 텍스트 수집 (최신순 최대 limit개)
  const reviewDocs = await Review.find({ location: locationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("content")
    .lean();
  const reviews = reviewDocs
    .map((r) => (typeof r.content === "string" ? r.content.trim() : ""))
    .filter((s) => s.length > 0);

  const res = await client.post(
    process.env.NLP_SUMMARY_ENDPOINT || "/api/v1/summarize/location",
    { locationId, reviews }
  );
  const summary = res?.data?.summary || "";
  await Location.updateOne(
    { _id: locationId },
    { $set: { llmreview: summary, lastSummaryAt: new Date() } }
  );
  return summary;
}

module.exports = { requestLocationSummary, shouldTriggerSummary };


