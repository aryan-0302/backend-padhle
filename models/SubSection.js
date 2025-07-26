import mongoose from "mongoose";

const subSectionSchema=new mongoose.Schema({
    title:{
        type:String,
    },
    timeDuration:{
        type:String
    },
    description:{
        type:String,
    },
    videoUrl:{
        type:String,
    },
    transcript: {
        type: String, // Stores the transcribed text for quiz generation
    },
    quizzes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
        }
    ],
    smartNotes: { type: String },
});
const subSection=mongoose.model("subSection",subSectionSchema);
export default subSection;