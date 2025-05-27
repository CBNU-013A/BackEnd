const mongoose = require("mongoose");

const sentimentSchema = new mongoose.Schema(
  {
    pos: { type: Number, default: 0 },
    neg: { type: Number, default: 0 },
  },
  { _id: false }
);

const keywordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sentiment: sentimentSchema,
});

module.exports =
  mongoose.models.Keyword || mongoose.model("Keyword", keywordSchema);
