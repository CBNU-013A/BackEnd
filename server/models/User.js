const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: false },
  recentsearch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  keywords: [
    {
      subKeyword: { type: mongoose.Schema.Types.ObjectId, ref: "SubKeyword" },
      value: { type: Number, default: 0 }, // 1이면 선택된 키워드
    },
  ],
  address: { type: String, required: false },
  birthdate: { type: Date, required: true },
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    default: [],
  },
  // 사용자가 고른 소분류 카테고리 ID 배열
  preferences: [
    {
      type: Schema.Types.ObjectId,
      ref: "SubKeyword",
    },
  ],
  // (2) 감성분석 키워드(Keyword) 선택 저장 필드
  keywordPreferences: [
    {
      type: Schema.Types.ObjectId,
      ref: "Keyword",
    },
  ],
});

// // ✅ 신규 유저 저장 전 자동으로 keywords 세팅
// userSchema.pre("save", async function (next) {
//   if (!this.keywords || this.keywords.length === 0) {
//     const allSubKeywords = await SubKeyword.find({});
//     this.keywords = allSubKeywords.map((sub) => ({
//       subKeyword: sub._id,
//       value: 0,
//     }));
//   }
//   next();
// });

module.exports = mongoose.model("User", UserSchema);
