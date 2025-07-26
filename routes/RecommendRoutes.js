import express from "express"
const router=express.Router()
import {getSmartRecommendations} from "../controllers/Recommendations.js"


// bard recommendations:
import { getBardRecommendation } from "../controllers/Recommendations.js";

router.get("/:userId", async (req, res) => {
  try {
    const chromarecommendations = await getSmartRecommendations(req.params.userId);
    if(chromarecommendations.length==0){
      return res.status(404).json({ success: false, message: "No matching products found." });
    }

    // step-2:
    const bardRecommendation=await getBardRecommendation(chromarecommendations,req.params.userId);
    res.status(200).json({ success: true, recommendations: bardRecommendation });
} catch (error) {
    res.status(500).json({ success: false, message: error.message });
}
  });
export default router