import mongoose from "mongoose";

const savedFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
});

export const SavedFile = mongoose.model("SavedFile", savedFileSchema);
