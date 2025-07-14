// models/FileShareAnalytics.js
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
    earnings: Number,

    viewers: [
        {
            country: { type: String },
            views: { type: Number, default: 1 },
            earnings: { type: Number, default: 0 },
        }
    ],

    pendingRewards: [
        {
            amount: Number,
            createdAt: { type: Date, default: Date.now }
        }
    ],

    confirmedRewards: {
        type: Number,
        default: 0
    },

    promoterRewards: [
        {
            promoterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            amount: Number,
            createdAt: Date
        }
    ],


    totalEarnings: {
        type: Number,
        default: 0
    }
});

export const FileShareAnalytics = mongoose.model("Analises", FileShareAnalyticsSchema);
