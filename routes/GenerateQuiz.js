import express from "express"
import generateQuizForSubsection from "../controllers/quizcontroller.js"

const router = express.Router();
router.post("/quiz/:subsectionId", generateQuizForSubsection);
export default router