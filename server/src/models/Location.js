const mongoose = require("mongoose");
const { Schema } = mongoose;

const SentimentCountSchema = new Schema(
  {
    pos: { type: Number, default: 0 },
    neg: { type: Number, default: 0 },
    none: { type: Number, default: 0 },
  },
  { _id: false }
);

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

const LocationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // 여행지 이름
    aggregatedAnalysis: {
      // 기능성 키워드 감성 집계 (예: 주차·화장실… 총 11개)
      sentiments: {
        type: Map,
        of: SentimentCountSchema,
        default: {},
      },
      // 소분류(SubKeyword) 빈도 벡터 — 21차원
      categories: {
        type: Map,
        of: Number,
        default: {},
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

    // ─────────────── 추가된 지역 필드 ───────────────
    province: { type: String }, // 도/광역시 (예: "충청북도")
    sgg: { type: String }, // 시군구 전체 (예: "청주시", "괴산군")
    cityKey: { type: String }, // 접미사 제거한 핵심 키 (예: "청주", "괴산")
    cityFlags: { type: Map, of: Boolean, default: {} }, // { "청주": true }
  },
  { timestamps: true }
);

// 인덱스
LocationSchema.index({ province: 1, cityKey: 1 });
LocationSchema.index({ "cityFlags.$**": 1 }); // 동적 cityFlags 검색용

module.exports = mongoose.model("Location", LocationSchema);
