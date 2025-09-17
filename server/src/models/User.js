const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  id: String,
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: false },
  recentsearch: [{ type: Schema.Types.ObjectId, ref: "Location" }],
  address: { type: String, required: false },
  birthdate: { type: Date, required: true },
  likes: {
    type: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    default: [],
  },
  prompts: [{ type: Schema.Types.ObjectId, ref: "PromptRecommend" }],
});


module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
