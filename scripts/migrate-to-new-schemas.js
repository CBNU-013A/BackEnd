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

const mongoose = require("mongoose");

// Import models
const Review = require("../server/src/models/Review");
const PromptRecommend = require("../server/src/models/PromptRecommend");
const Location = require("../server/src/models/Location");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
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
  console.log("Connecting:", uri);
  await mongoose.connect(uri);

  try {
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


