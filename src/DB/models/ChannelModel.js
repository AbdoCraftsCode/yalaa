import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "اسم القناة مطلوب"],
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    image: {
        secure_url: {
            type: String,
            required: [true, "الصورة مطلوبة"]
        },
        public_id: {
            type: String,
            required: [true, "Public_id مطلوب"]
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const ChannelModel = mongoose.model("Channel", channelSchema);
