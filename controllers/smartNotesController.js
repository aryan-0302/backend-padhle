import axios from "axios";
import subSection from "../models/SubSection.js";


const generateSmartNotes = async (req, res) => {
    try {
        const { subsectionId } = req.params;

        const subsection = await subSection.findById(subsectionId);
        if (!subsection) {
            return res.status(404).json({ message: "Subsection not found" });
        }

        const transcriptText = subsection.transcript;
        if (!transcriptText) {
            return res.status(400).json({ message: "No transcript available" });
        }
        console.log("transcirpt:",transcriptText);

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `Summarize and create structured study notes from this transcript: ${transcriptText}` }]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                
            }
        );
        console.log("resonse:",response)

        const smartNotes = response.data.candidates[0].content.parts[0].text;
        console.log("smart notes:",smartNotes)

        subsection.smartNotes = smartNotes;
        await subsection.save();

        return res.status(200).json({
            message: "Smart Notes generated successfully",
            smartNotes,
        });

    } catch (error) {
        console.error("Error generating smart notes:", error.response?.data || error);
        return res.status(500).json({ message: "Failed to generate smart notes" });
    }
};
export default generateSmartNotes