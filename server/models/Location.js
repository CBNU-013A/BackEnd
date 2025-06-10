const mongoose = require("mongoose");

const keywordStatSchema = new mongoose.Schema(
  {
    subKeyword: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubKeyword",
      required: true,
    },
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 여행지 이름
  aggregatedAnalysis: {
    sentiments: {
      주차: { pos: Number, neg: Number, none: Number },
      화장실: { pos: Number, neg: Number, none: Number },
      활동: { pos: Number, neg: Number, none: Number },
      시설관리: { pos: Number, neg: Number, none: Number },
      혼잡도: { pos: Number, neg: Number, none: Number },
      접근성: { pos: Number, neg: Number, none: Number },
      편의시설: { pos: Number, neg: Number, none: Number },
      가성비: { pos: Number, neg: Number, none: Number },
      아이동반: { pos: Number, neg: Number, none: Number },
      노약자동반: { pos: Number, neg: Number, none: Number },
      장소: { pos: Number, neg: Number, none: Number },
    },
    categories: {
      계절: String,
      동반: String,
      장소: String,
      활동: String,
    },
  },
  image: [{ type: String }],
  tel: { type: String },
  keywords: [keywordStatSchema],
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
