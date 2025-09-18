const mongoose = require("mongoose");
const { Schema } = mongoose;

const sentimentAspectSchema = new Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.SentimentAspect || mongoose.model("SentimentAspect", sentimentAspectSchema);
