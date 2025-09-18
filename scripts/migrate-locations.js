// Migrate Location docs to current schema
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

const Location = require("../server/src/models/Location");

function getMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/pik"
  );
}

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
  const t = norm.split(/\s+/);
  const sgg = t[1] || "";
  return {
    province: t[0] || "",
    sgg,
    cityKey: sgg.replace(/(시|군|구)$/, ""),
  };
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
    const cursor = Location.find({}).select("_id addr1 aggregatedAnalysis").cursor();
    let updated = 0;
    for await (const doc of cursor) {
      const { province, sgg, cityKey } = extractRegion(doc.addr1);
      const cityFlags = cityKey ? { [cityKey]: true } : {};
      const aggregatedAnalysis = { sentimentAspects: {}, categories: {} };
      const res = await Location.updateOne(
        { _id: doc._id },
        {
          $set: { province, sgg, cityKey, cityFlags, aggregatedAnalysis },
        }
      );
      updated += res.modifiedCount || 0;
    }
    console.log(`Location migrated: ${updated}`);
  } catch (err) {
    console.error("Location migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}


