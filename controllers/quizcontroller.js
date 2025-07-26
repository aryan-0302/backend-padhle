import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
import subSection from "../models/SubSection.js";

// Step 1: Clean Transcript
function cleanText(text) {
  return text.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().trim();
}





// Step 2: Extract Key Topics from Transcript
async function extractKeyConcepts(text) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract key topics from this transcript: \n\n${text}`;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error extracting concepts:", error);
      return null;
    }
}









// Step 3: Generate Quiz Questions
async function generateQuiz(lectureTopics) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Generate a quiz (MCQs, True/False, Fill-in-the-Blanks) from these topics: \n\n${lectureTopics}`;
  
      const result = await model.generateContent(prompt);
      console.log("result:",result);
      const response = await result.response;

      console.log("reponse:",response)
      // Ensure response is JSON
      
      return response.text()
    } catch (error) {
      console.error("Error generating quiz:", error);
      return null;
    }
}























// Step 4: Generate Quiz for a Subsection
const generateQuizForSubsection = async (req, res) => {
  try {
    const { subsectionId } = req.params;
    console.log("subsection Id:",subsectionId)

    const subsection = await subSection.findById(subsectionId);
    console.log("sub section",subSection)

    if (!subsection) {
      return res.status(404).json({ error: "Subsection not found" });
    }

    // Check if transcript exists
    if (!subsection.transcript) {
      return res.status(400).json({ error: "No transcript found for this subsection" });
    }

    console.log("Step 1: Cleaning transcript...");
    const cleanedText = cleanText(subsection.transcript);
    console.log("cleaned text:",cleanedText)


    console.log("Step 2: Extracting key concepts...");
    const keyConcepts = await extractKeyConcepts(cleanedText);
    console.log("key concepts:",keyConcepts)

    if (!keyConcepts) return res.status(500).json({ error: "Failed to extract key concepts" });

    console.log("Step 3: Generating quiz...");
    const quiz = await generateQuiz(keyConcepts);
    if (!quiz) return res.status(500).json({ error: "Failed to generate quiz" });

    
    subsection.quizzes.push(quiz._id);
    await subsection.save();


    res.status(200).json({ message: "Quiz generated successfully!", quiz });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export default generateQuizForSubsection