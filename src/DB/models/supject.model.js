import mongoose from "mongoose";
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true }
});
export const SubjectModel = mongoose.model("Subject", subjectSchema);
