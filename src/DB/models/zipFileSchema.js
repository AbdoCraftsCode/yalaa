// src/models/ZipFile.js
import mongoose from "mongoose";

const zipFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
        default: () => `my-files-${Date.now()}.zip`
    },
    fileType: {
        type: String,
        default: "application/zip"
    },
    fileSize: {
        type: Number, // MB
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    shared: {
        type: Boolean,
        default: false,
    },
    sharedUrl: {
        type: String,
    },
    items: [{  // عشان نعرف الـ ZIP ده فيه إيه (اختياري للعرض)
        type: { type: String }, // 'file' or 'folder'
        id: { type: mongoose.Schema.Types.ObjectId }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const ZipFile = mongoose.model("ZipFile", zipFileSchema);