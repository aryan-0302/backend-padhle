import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  subsectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subsection",
    required: true,
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
        },
      ],
      correctAnswer: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["MCQ", "True/False", "Fill-in-the-Blanks"],
        required: true,
      },
    },
  ],
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz