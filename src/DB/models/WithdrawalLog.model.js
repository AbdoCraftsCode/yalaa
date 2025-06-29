// models/withdrawal.model.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "USD"
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "completed"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const WithdrawalLog = mongoose.model("WithdrawalLog", withdrawalSchema);
