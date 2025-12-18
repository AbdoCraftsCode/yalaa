// models/WithdrawalRequest.model.js
import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },                // 💵 المبلغ
    paymentMethod: { type: String, required: true },         // 💳 وسيلة الدفع
    whatsappNumber: { type: String, required: true },
    reason: { type: String},        
    // 📱 رقم الواتساب

    details: {
        type: mongoose.Schema.Types.Mixed, // ✅ Object بدلاً من Array
        required: true
    },// ✅ التفاصيل المطلوبة بناءً على وسيلة الدفع

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
