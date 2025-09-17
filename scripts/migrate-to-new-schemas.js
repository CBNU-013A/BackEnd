/*
  Migration: Align existing documents to new schema structures

  - Review.sentimentAspects: [{ type, sentiment:{...} }] -> [{ aspect, sentiment:{pos,neg,none} }]
  - Review.categories: [{ type, value:{ type } }] -> [{ category, value:{ tag } }]
  - PromptRecommend.category: [{ type, value:{ type } }] -> [{ category, value:{ tag } }]
  - Location.aggregatedAnalysis.categories: { key: { type, value:{ type, count } } }
      -> { key: { category, value:{ tag, count } } }

  Usage:
    MONGO_URI="mongodb://localhost:27017/yourdb" node scripts/migrate-to-new-schemas.js
*/

const path = require("path");

// Ensure module resolution can find server/node_modules when run from repo root
try {
  const serverNodeModules = path.join(__dirname, "../server/node_modules");
  process.env.NODE_PATH = [serverNodeModules, process.env.NODE_PATH || ""].filter(Boolean).join(":");
  require("module").Module._initPaths();
} catch (_) {}

// Load .env (prefer server/.env, fallback to project .env)
try {
  const dotenv = require("dotenv");
  const serverEnv = path.join(__dirname, "../server/.env");
  const rootEnv = path.join(__dirname, "../.env");
  dotenv.config({ path: serverEnv });
  dotenv.config({ path: rootEnv });
} catch (_) {}

const { createRequire } = require("module");
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e1) {
  try {
    const serverRequire = createRequire(path.join(__dirname, "../server/package.json"));
    mongoose = serverRequire("mongoose");
  } catch (e2) {
    console.error("Cannot find module 'mongoose'. Please run 'npm install' in server/ or root.");
    console.error(e2?.message || e2);
    process.exit(1);
  }
}

// Import models
const Review = require("../server/src/models/Review");
const PromptRecommend = require("../server/src/models/PromptRecommend");
const Location = require("../server/src/models/Location");
const SentimentAspect = require("../server/src/models/SentimentAspect");
const PreferenceTag = require("../server/src/models/PreferenceTag");
const Category = require("../server/src/models/Category");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
}

// Legacy collection handles (no Mongoose schema required)
function legacyKeywords() {
  return mongoose.connection.db.collection("keywords");
}
function legacySubkeywords() {
  return mongoose.connection.db.collection("subkeywords");
}

async function migrateLegacyKeywordsToSentimentAspects() {
  const col = legacyKeywords();
  const cursor = col.find({});
  let upserts = 0;
  for await (const doc of cursor) {
    const name = doc?.name || doc?.keyword || doc?._id?.toString?.();
    if (!name) continue;
    await SentimentAspect.updateOne(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    );
    upserts += 1;
  }
  return upserts;
}

async function migrateLegacySubkeywordsToPreferenceTags() {
  const col = legacySubkeywords();
  const cursor = col.find({});
  let upserts = 0;
  // 카테고리 매핑: subkeyword.categoryName(or categoryId) → Category._id
  const categoryByName = new Map(
    (await Category.find().select("name _id").lean()).map((c) => [c.name, c._id])
  );

  for await (const doc of cursor) {
    const name = doc?.name || doc?.label || doc?._id?.toString?.();
    if (!name) continue;
    let categoryId = null;
    if (doc?.categoryId) categoryId = doc.categoryId;
    if (!categoryId && doc?.category) {
      categoryId = categoryByName.get(doc.category) || null;
    }
    await PreferenceTag.updateOne(
      { name },
      { $setOnInsert: { name, category: categoryId } },
      { upsert: true }
    );
    upserts += 1;
  }
  return upserts;
}

async function migrateReviewSentimentAspects() {
  const cursor = Review.find({ "sentimentAspects.type": { $exists: true } })
    .select("_id sentimentAspects")
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const next = (Array.isArray(doc.sentimentAspects) ? doc.sentimentAspects : []).map(
      (item) => {
        if (item && item.type) {
          const sentiment = item.sentiment || {};
          return {
            aspect: item.type,
            sentiment: {
              pos: Number(!!sentiment.pos),
              neg: Number(!!sentiment.neg),
              none: Number(!!sentiment.none || (!sentiment.pos && !sentiment.neg)),
            },
          };
        }
        return item;
      }
    );

    await Review.updateOne({ _id: doc._id }, { $set: { sentimentAspects: next } });
    updated += 1;
  }
  return updated;
}

async function migrateReviewCategories() {
  const cursor = Review.find({ "categories.type": { $exists: true } })
    .select("_id categories")
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const next = (Array.isArray(doc.categories) ? doc.categories : []).map((c) => {
      if (c && c.type) {
        return {
          category: c.type,
          value: { tag: c?.value?.type },
        };
      }
      return c;
    });
    await Review.updateOne({ _id: doc._id }, { $set: { categories: next } });
    updated += 1;
  }
  return updated;
}

async function migratePromptRecommendCategory() {
  const cursor = PromptRecommend.find({ "category.type": { $exists: true } })
    .select("_id category")
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const next = (Array.isArray(doc.category) ? doc.category : []).map((c) => {
      if (c && c.type) {
        return {
          category: c.type,
          value: { tag: c?.value?.type },
        };
      }
      return c;
    });
    await PromptRecommend.updateOne({ _id: doc._id }, { $set: { category: next } });
    updated += 1;
  }
  return updated;
}

async function migrateLocationAggregatedCategories() {
  const cursor = Location.find({ "aggregatedAnalysis.categories": { $type: "object" } })
    .select("_id aggregatedAnalysis.categories")
    .cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const categories = doc?.aggregatedAnalysis?.categories || {};
    const newMap = {};
    for (const k of Object.keys(categories)) {
      const v = categories[k] || {};
      const category = v.category || v.type || null;
      const tag = v?.value?.tag || v?.value?.type || null;
      const count = typeof v?.value?.count === "number" ? v.value.count : 0;
      newMap[k] = { category, value: { tag, count } };
    }
    await Location.updateOne(
      { _id: doc._id },
      { $set: { "aggregatedAnalysis.categories": newMap } }
    );
    updated += 1;
  }
  return updated;
}

async function main() {
  const uri = getMongoUri();
  console.log("Connecting:");
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB;
  if (dbName) {
    await mongoose.connect(uri, { dbName });
  } else {
    await mongoose.connect(uri);
  }

  try {
    // 0) Legacy collections → New models
    const res0a = await migrateLegacyKeywordsToSentimentAspects();
    console.log("Legacy keywords → SentimentAspect upserts:", res0a);
    const res0b = await migrateLegacySubkeywordsToPreferenceTags();
    console.log("Legacy subkeywords → PreferenceTag upserts:", res0b);

    const res1 = await migrateReviewSentimentAspects();
    console.log("Review.sentimentAspects migrated:", res1);

    const res2 = await migrateReviewCategories();
    console.log("Review.categories migrated:", res2);

    const res3 = await migratePromptRecommendCategory();
    console.log("PromptRecommend.category migrated:", res3);

    const res4 = await migrateLocationAggregatedCategories();
    console.log("Location.aggregatedAnalysis.categories migrated:", res4);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

if (require.main === module) {
  main();
}


