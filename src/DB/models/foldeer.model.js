import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    shared: { type: Boolean, default: false }, 
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    sharedUrl: { type: String, default: null }, 
});

export const Folder = mongoose.model("Folder", folderSchema);
