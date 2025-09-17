// Seed City collection from server/public/location.js
const path = require("path");

// Resolve server modules and envs
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

const City = require("../server/src/models/City");
const { ALL_CHUNGBUK_CITIES } = require("../server/public/location");

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
    let upserts = 0;
    for (const name of ALL_CHUNGBUK_CITIES) {
      await City.updateOne(
        { name },
        { $setOnInsert: { name, isActive: true } },
        { upsert: true }
      );
      upserts++;
    }
    console.log(`Seeded cities: ${upserts}`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}


