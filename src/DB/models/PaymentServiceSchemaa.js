import mongoose from "mongoose";

const PaymentServiceSchema = new mongoose.Schema(
    {
        // اسم الخدمة
        paymentType: {
            type: String,
            required: true,
            enum: [
                "PayPal",
                "VodafoneCash",
                "Payeer",
                "WebMoney",
                "USDT_TRC20",
                "Payoneer"
            ]
        },

        // بيانات الخدمة نفسها
        credentials: {
            email: { type: String },
            phoneNumber: { type: String },
            walletAddress: { type: String },
            accountId: { type: String }
        },

        // اسم صاحب الحساب (اختياري)
        accountName: {
            type: String
        },

        // هل الخدمة مفعلة
        isActive: {
            type: Boolean,
            default: true
        },

        // هل هي الخدمة الافتراضية
        isDefault: {
            type: Boolean,
            default: false
        },

        // ملاحظات
        note: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("PaymentServicee", PaymentServiceSchema);
