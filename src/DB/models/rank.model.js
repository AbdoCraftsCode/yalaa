import mongoose from "mongoose";

const rankSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true 
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    }
}, { timestamps: true });

export const RankModel = mongoose.model("Rank", rankSchema);
