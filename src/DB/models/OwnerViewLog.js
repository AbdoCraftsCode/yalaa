import mongoose from "mongoose";

const ownerViewLogSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    ip: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now }
});

// export default mongoose.model("OwnerViewLog", ownerViewLogSchema);
export const OwnerViewLog = mongoose.model("OwnerViewLog", ownerViewLogSchema);