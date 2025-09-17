// Standalone runner for taxonomy sync from PikNLP
const path = require("path");

// Make sure we can resolve server deps and load envs
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
try {
  mongoose = require("mongoose");
} catch (e1) {
  const serverRequire = createRequire(path.join(__dirname, "../server/package.json"));
  mongoose = serverRequire("mongoose");
}

const { syncAllTaxonomy } = require("../server/src/services/taxonomySync");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
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
    const { catCount, tagCount, aspectCount } = await syncAllTaxonomy();
    console.log(`Synced — categories: ${catCount}, tags: ${tagCount}, aspects: ${aspectCount}`);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

if (require.main === module) {
  main();
}


