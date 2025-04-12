import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Types.ObjectId, ref: "Question", required: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
}, { timestamps: true });

export const AnswerModel = mongoose.model("Answer", answerSchema);
