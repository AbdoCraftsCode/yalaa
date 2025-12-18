import mongoose from "mongoose";

const archiveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",  // array من IDs الملفات
        default: []
    }],
    folders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",  // array من IDs المجلدات
        default: []
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// فهرسة لتحسين جلب الأرشيفات لمستخدم معين
archiveSchema.index({ userId: 1, createdAt: -1 });

export const Archive = mongoose.model("Archive", archiveSchema);