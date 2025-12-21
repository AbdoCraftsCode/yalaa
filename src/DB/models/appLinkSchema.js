// models/AppLink.js
import mongoose from "mongoose";

const appLinkItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        // مثال: "Android", "iOS", "Web", "Update"
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        enum: ["android", "ios", "web", "both"],
        default: "both"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const appLinksSchema = new mongoose.Schema({
    links: [appLinkItemSchema] // array من اللينكات
}, {
    timestamps: true
});

// نضمن وثيقة واحدة فقط في الكولكشن (singleton pattern)
appLinksSchema.statics.getInstance = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({ links: [] });
    }
    return doc;
};

export const AppLink = mongoose.model("AppLink", appLinksSchema);