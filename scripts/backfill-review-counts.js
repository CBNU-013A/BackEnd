// Backfill Location.reviewCount from Review collection
const path = require("path");

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

const Review = require("../server/src/models/Review");
const Location = require("../server/src/models/Location");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
}

async function main() {
  const uri = getMongoUri();
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB;
  if (dbName) {
    await mongoose.connect(uri, { dbName });
  } else {
    await mongoose.connect(uri);
  }

  try {
    const pipeline = [
      { $group: { _id: "$location", count: { $sum: 1 } } },
    ];
    const agg = await Review.aggregate(pipeline);
    let updates = 0;
    for (const { _id, count } of agg) {
      if (!_id) continue;
      const res = await Location.updateOne({ _id }, { $set: { reviewCount: count } });
      updates += res.modifiedCount || 0;
    }
    console.log(`Backfilled reviewCount for ${updates} locations.`);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}


