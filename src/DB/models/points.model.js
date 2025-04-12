import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },
    totalPoints: { type: Number, default: 0 }
}, { timestamps: true });

export const PointModel = mongoose.model("Point", pointSchema);
