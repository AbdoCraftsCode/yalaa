import mongoose from "mongoose";


const imageSchema = new mongoose.Schema({
    image: [
        {
            secure_url: String,
            public_id: String
        }
    ]

}, { timestamps: true });

export const ImageModel = mongoose.model("Image", imageSchema);
