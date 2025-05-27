const keywordSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports =
  mongoose.models.Keyword || mongoose.model("Keyword", keywordSchema);
