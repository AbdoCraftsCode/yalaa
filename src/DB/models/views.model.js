// import mongoose from "mongoose";

// const viewLogSchema = new mongoose.Schema({
//     fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
//     country: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now },
//     ip: { type: String },
// });

// export const ViewLog = mongoose.model('ViewLog', viewLogSchema);// models/FileViewLog.js
import mongoose from 'mongoose';

const fileViewLogSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    country: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now }
});


export const ViewLog = mongoose.model('FileViewLog', fileViewLogSchema);// models/FileViewLog.js