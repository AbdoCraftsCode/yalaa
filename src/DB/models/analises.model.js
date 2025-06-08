import mongoose from "mongoose";

const FileShareAnalyticsSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
        unique: true,
    },
    downloads: {
        type: Number,
        default: 0,
    },
    views: {
        type: Number,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

export const FileShareAnalytics = mongoose.model("Analises", FileShareAnalyticsSchema);