const mongoose = require("mongoose");

const sentimentSchema = new mongoose.Schema(
  {
    none: { type: Number, default: 0 },
    pos: { type: Number, default: 0 },
    neg: { type: Number, default: 0 },
    neu: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const KeywordSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true }, // 키워드 텍스트
    sentiment: sentimentSchema,
  },
  { _id: false }
);

module.exports =
  mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);

const LocationSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 여행지 이름
  image: [{ type: String }],
  tel: { type: String },
  keywords: [KeywordSchema], // 키워드
  review: [{ type: String }], // 리뷰
  likes: { type: Number, default: 0 }, // 좋아요
  contentid: { type: String },
  contenttypeid: { type: String },
  homepage: { type: String },
  firstimage: { type: String },
  firstimage2: { type: String },
  areacode: { type: String },
  addr1: { type: String },
  zipcode: { type: String },
  mapx: { type: Number },
  mapy: { type: Number },
  overview: { type: String },
});

module.exports = mongoose.model("Location", LocationSchema);
