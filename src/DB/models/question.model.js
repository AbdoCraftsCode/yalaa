import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    mark: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true }
   
}, { timestamps: true });

export const QuestionModel = mongoose.model("Question", questionSchema);
