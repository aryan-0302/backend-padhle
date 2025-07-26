import dotenv from "dotenv";
import Doubt from "../models/doubtModel.js";
import subSection from "../models/SubSection.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const solveDoubt = async (req, res) => {
    try {
        const { userId, subsectionId, question } = req.body;

        const subsection = await subSection.findById(subsectionId);
        if (!subsection) {
            return res.status(404).json({ error: "Subsection not found" });
        }

        const transcript = subsection.transcript || "";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are an AI tutor. A student has a doubt based on the lecture transcript below: 
        \n\n**Transcript:** ${transcript} 
        \n\n**Question:** ${question} 
        \n\nProvide a clear and accurate explanation.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const doubt = new Doubt({
            userId,
            subsectionId,
            question,
            answer: responseText
        });
        await doubt.save();

        return res.status(200).json({ question, answer: responseText });

    } catch (error) {
        console.error("Error solving doubt:", error);
        return res.status(500).json({ error: "Something went wrong" });
    }
};
export {solveDoubt}