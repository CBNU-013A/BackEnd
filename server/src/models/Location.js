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

const categoryCountSchema = new Schema({
  type: Schema.Types.ObjectId,
  ref: "Category",
  value: {
    type: Schema.Types.ObjectId,
    ref: "PreferenceTag",
    count: { type: Number, default: 0 },
  },
});

const LocationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // 여행지 이름
    aggregatedAnalysis: {
      sentimentAspects: {
        type: Map,
        of: SentimentCountSchema,
        default: {},
      },
      categories: {
        type: Map,
        of: categoryCountSchema,
        default: {},
      },
    },
    image: [{ type: String }],
    tel: { type: String },
    review: [{ type: String }], // 리뷰
    likes: { type: Number, default: 0 }, // 좋아요
    
    // ─────────────── TourAPI ───────────────
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

    // ─────────────── LLM ───────────────
    llmoverview: { type: String },
    llmreview: { type: String },
  },
  { timestamps: true }
);

// 인덱스
LocationSchema.index({ province: 1, cityKey: 1 });
LocationSchema.index({ "cityFlags.$**": 1 }); // 동적 cityFlags 검색용

module.exports = mongoose.model("Location", LocationSchema);
