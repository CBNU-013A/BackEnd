// Re-analyze existing reviews with NLP and save to new schema
const path = require("path");

// Resolve server deps and envs
try {
  const serverNodeModules = path.join(__dirname, "../server/node_modules");
  process.env.NODE_PATH = [serverNodeModules, process.env.NODE_PATH || ""].filter(Boolean).join(":");
  require("module").Module._initPaths();
} catch (_) {}

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(__dirname, "../server/.env") });
  dotenv.config({ path: path.join(__dirname, "../.env") });
} catch (_) {}

const { createRequire } = require("module");
let mongoose;
try { mongoose = require("mongoose"); } catch {
  const serverRequire = createRequire(path.join(__dirname, "../server/package.json"));
  mongoose = serverRequire("mongoose");
}

const axios = require("axios");
const Review = require("../server/src/models/Review");
const Category = require("../server/src/models/Category");
const PreferenceTag = require("../server/src/models/PreferenceTag");
const SentimentAspect = require("../server/src/models/SentimentAspect");
const { recomputeLocationAnalysis } = require("../server/src/utils/locationAnalysis");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
}

function createClient() {
  const baseURL = process.env.NLP_BASE_URL || process.env.SENTIMENT_API_URL || "";
  const apiKey = process.env.NLP_API_KEY || process.env.SENTIMENT_API_KEY || "";
  return axios.create({
    baseURL,
    headers: { "nlp-api-key": apiKey, "Content-Type": "application/json" },
    timeout: 60000,
  });
}

async function analyze(content) {
  const client = createClient();
  const res = await client.post("/api/v1/predict", { text: content });
  return res?.data || null; // expect { sentiments, categories }
}

async function mapSentiments(sentiments) {
  // sentiments: { [aspectName]: 'pos'|'neg'|'none' }
  const entries = Object.entries(sentiments || {});
  const result = [];
  for (const [name, val] of entries) {
    const aspect = await SentimentAspect.findOne({ name }).select("_id");
    if (!aspect) continue;
    result.push({
      aspect: aspect._id,
      sentiment: {
        pos: val === "pos" ? 1 : 0,
        neg: val === "neg" ? 1 : 0,
        none: val !== "pos" && val !== "neg" ? 1 : 0,
      },
    });
  }
  return result;
}

function normalizeCategories(nlpCategories) {
  // support array of {category, tag} or object map { category: [tag, ...] }
  const out = [];
  if (Array.isArray(nlpCategories)) {
    for (const item of nlpCategories) {
      const categoryName = item?.category || item?.name;
      const tagName = item?.tag || item?.value;
      if (!categoryName || !tagName) continue;
      out.push([categoryName, tagName]);
    }
  } else if (nlpCategories && typeof nlpCategories === "object") {
    for (const [categoryName, value] of Object.entries(nlpCategories)) {
      if (Array.isArray(value)) {
        for (const tagName of value) {
          if (!tagName) continue;
          out.push([categoryName, tagName]);
        }
      } else if (typeof value === "string") {
        if (value) out.push([categoryName, value]);
      }
    }
  }
  return out;
}

async function mapCategories(nlpCategories) {
  const pairs = normalizeCategories(nlpCategories);
  const docs = [];
  for (const [categoryName, tagName] of pairs) {
    if (String(tagName).toLowerCase() === "none") continue; // skip none
    let categoryDoc = await Category.findOne({ name: categoryName }).select("_id name");
    if (!categoryDoc) {
      categoryDoc = await Category.create({ name: categoryName });
    }
    let tagDoc = await PreferenceTag.findOne({ name: tagName, category: categoryDoc._id }).select("_id name");
    if (!tagDoc) {
      tagDoc = await PreferenceTag.create({ name: tagName, category: categoryDoc._id });
    }
    docs.push({ category: categoryDoc._id, value: { tag: tagDoc._id } });
  }
  return docs;
}

async function main() {
  const uri = getMongoUri();
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB;
  if (dbName) {
    await mongoose.connect(uri, { dbName });
  } else {
    await mongoose.connect(uri);
  }

  const limit = Number(process.env.REANALYZE_LIMIT || 0); // 0 = all
  const doAggregate = String(process.env.REAGGREGATE || "true").toLowerCase() !== "false";

  try {
    const query = {};
    const cursor = Review.find(query).select("_id content location").cursor();
    let processed = 0;
    for await (const r of cursor) {
      if (limit && processed >= limit) break;
      const nlp = await analyze(r.content);
      if (!nlp) continue;
      const sentimentAspects = await mapSentiments(nlp.sentiments);
      const categories = await mapCategories(nlp.categories);
      await Review.updateOne(
        { _id: r._id },
        { $set: { sentimentAspects, categories }, $unset: { keywords: "" } }
      );
      if (doAggregate && r.location) {
        await recomputeLocationAnalysis(r.location);
      }
      processed++;
      if (processed % 50 === 0) console.log(`Processed ${processed} reviews...`);
    }
    console.log(`Done. Processed: ${processed}`);
  } catch (err) {
    console.error("Re-analyze failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}


