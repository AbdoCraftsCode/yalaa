// models/CopyrightReport.model.js
import mongoose from "mongoose";

const CopyrightReportSchema = new mongoose.Schema({
    type: {
        type: String,
        // enum: ["Audio", "Video", "Image", "Document", "Other"],
        required: true,
    },
    copyrightUrlsFile: { type: String, required: true }, // اسم أو رابط الملف المرفوع
    copyrightOwnerName: { type: String, required: true },
    relationshipWithContent: { type: String, required: true },
    email: { type: String,  trim: true },
    phoneNumber: { type: String, required: true },
    country: { type: String, required: true },
    province: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    signature: { type: String, required: true },
       userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number, // MB
            required: true,
        },
        url: {
            type: String,
            required: true,
        },// ممكن يكون نص أو URL لصورة
}, { timestamps: true });

export const CopyrightReportModel = mongoose.model("CopyrightReport", CopyrightReportSchema);
