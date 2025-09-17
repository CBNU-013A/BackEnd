// server/src/models/PromptRecommend.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const PromptRecommendSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    time: {
        type: Date,
        default: Date.now,
    },
    city: [{
        type: Schema.Types.ObjectId,
        ref: "City",
    }],
    category: [{
        type: Schema.Types.ObjectId,
        ref: "Category",
        value: {
            type: Schema.Types.ObjectId,
            ref: "PreferenceTag",
        }
    }],
    sentimentAspects: [{
        type: Schema.Types.ObjectId,
        ref: "SentimentAspect",
    }],
    result: [{
        type: Schema.Types.ObjectId,
        ref: "Location",
    }]
});

module.exports = mongoose.models.PromptRecommend || mongoose.model("PromptRecommend", PromptRecommendSchema);