// src/models/file.model.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
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
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder"
    },
    sharedUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


const File = mongoose.model("File", fileSchema);
export default File;