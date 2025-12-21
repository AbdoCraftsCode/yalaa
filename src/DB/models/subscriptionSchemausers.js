import mongoose, { Schema, Types } from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        planName: {
            type: String,
            required: true
        },

        durationDays: {
            type: Number,
            required: true,
            min: 1
        },

        subscriberName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },
 
        // صورة الفاتورة
        invoicePic: {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true }
        },

        // تاريخ بداية الاشتراك
        startDate: {
            type: Date,
            default: () => new Date()
        },

        // تاريخ نهاية الاشتراك (يتم حسابه تلقائياً)
        endDate: {
            type: Date
        },

        // الشخص اللي أنشأ الاشتراك (Owner أو Admin)
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// 🔥 قبل الحفظ احسب endDate تلقائياً
subscriptionSchema.pre("save", function (next) {
    if (this.durationDays) {
        this.endDate = new Date(
            this.startDate.getTime() + this.durationDays * 24 * 60 * 60 * 1000
        );
    }
    next();
});

const SubscriptionModell = mongoose.model("Subscriptionnn", subscriptionSchema);
export default SubscriptionModell;
