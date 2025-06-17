const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: String,
    description: String,
    filePath: {
        type: String, required: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model("Video", videoSchema);