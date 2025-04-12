

import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema({
   
    name: { type: String,  },
   
}, { timestamps: true });

export const ClassModel = mongoose.model("Class", ClassSchema);
