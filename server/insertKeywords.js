const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Category = require("./models/Category");
const SubKeyword = require("./models/SubKeyword");
const connectDB = require("./database");

dotenv.config();
mongoose.set("strictQuery", false);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/013A-dev";

const keywordData = [
  {
    category: "장소",
    items: [
      { name: "자연 경관" },
      { name: "역사/문화" },
      { name: "건축물/시설물" },
      { name: "전시/예술" },
    ],
  },
  {
    category: "활동",
    items: [
      { name: "산책/등산/트레킹" },
      { name: "관람/견학" },
      { name: "체험/참여 프로그램" },
      { name: "공연/행사" },
      { name: "먹거리/카페" },
      { name: "쇼핑/기념품" },
    ],
  },
  {
    category: "방문 대상",
    items: [
      { name: "가족" },
      { name: "연인" },
      { name: "친구" },
      { name: "반려동물" },
      { name: "유아/노약자 동반" },
      { name: "혼자" },
    ],
  },
  {
    category: "계절 / 시간대",
    items: [
      { name: "봄" },
      { name: "여름" },
      { name: "가을" },
      { name: "겨울" },
      { name: "낮" },
      { name: "야간" },
    ],
  },
  {
    category: "주차",
    items: [],
  },
  {
    category: "화장실",
    items: [],
  },
  {
    category: "시설관리상태",
    items: [],
  },
  {
    category: "혼잡",
    items: [],
  },
  {
    category: "접근성",
    items: [],
  },
  {
    category: "편의 시설 다양성",
    items: [],
  },
  {
    category: "가성비",
    items: [],
  },
  {
    category: "아이/노약자 동반",
    items: [],
  },
];

async function insertKeywords() {
  try {
    await connectDB(); // MongoDB 연결

    console.log("✅ MongoDB 연결됨");

    await Category.deleteMany({});
    await SubKeyword.deleteMany({});

    for (const { category, items } of keywordData) {
      const categoryDoc = await Category.create({ name: category });

      const subKeywords = items.map(({ name }) => ({
        name,
        category: categoryDoc._id,
      }));

      await SubKeyword.insertMany(subKeywords);
    }

    console.log("✅ 데이터 삽입 완료");
    process.exit();
  } catch (err) {
    console.error("❌ 에러 발생:", err);
    process.exit(1);
  }
}

insertKeywords();
