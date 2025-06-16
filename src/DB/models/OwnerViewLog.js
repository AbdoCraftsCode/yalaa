import mongoose from "mongoose";

const ownerViewLogSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    ip: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now }
});


export const OwnerViewLog = mongoose.model("OwnerViewLog", ownerViewLogSchema);