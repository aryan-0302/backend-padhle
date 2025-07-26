import { ChromaClient } from "chromadb";
import UserActivity from "../models/UserActivity.js";
import Course from "../models/Course.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Doubt from "../models/doubtModel.js";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chroma = new ChromaClient();
let collection;
async function initializeChroma() {
  collection = await chroma.createCollection({
         name: "my_colklection",
})
}





async function storeProductInChroma(course) {
  if (!collection) await initializeChroma();
  const document = `${course.courseName} - ${course.courseDescription}`;
  console.log("documnet:",document);
  const id = course._id.toString();
  const metadata = {
    courseName:course.courseName,
      category: course.category,
      tag: course.tag,
  };
  console.log("metadata:",metadata)
  await collection.add({
      documents: [document],
      ids: [id],
      metadatas: [metadata]
  });
  console.log(`Course added to ChromaDB: ${course.courseName}`);
}







async function getSmartRecommendations(userId) {
  if (!collection) await initializeChroma();

  const history = await UserActivity.find({ userId })
    .sort({ timeSpent: -1 }) 
    .limit(5);

  console.log("history:", history);
  if (!history.length) return [];

  const topEngagedProductId = history[0].productId;

  const topEngagedProduct = await Course.findById(topEngagedProductId);
  
  console.log("Top engaged product:", topEngagedProduct);
  if (!topEngagedProduct) return [];


  const userDoubts = await Doubt.find({ userId })
  .sort({ createdAt: -1 })
  .limit(3); 
  const doubtKeywords = userDoubts.map(doubt => doubt.query).join(" ");
  


  const results = await collection.query({
    queryTexts: [`${topEngagedProduct.courseName} ${doubtKeywords}`],
    n_results: 10,
  });

  console.log("ChromaDB Query Results:", results?.documents?.flat());
  return results?.documents?.flat() || [];
}










async function getBardRecommendation(chromadbResults,userId) {
  try {
    const history = await UserActivity.find({ userId })
    .sort({ timeSpent: -1 }) 
    .limit(5);
      console.log("history:", history);
      if (!history.length) return [];

      const topEngagedProductId = history[0].productId;

      const lastViewedProduct = await Course.findById(topEngagedProductId);
      console.log("last viewd product:",lastViewedProduct);

      const userQuery=lastViewedProduct.courseName;
      console.log("user queery:",userQuery)

      const userDoubts = await Doubt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3); 
      console.log("user doubts:",userDoubts)
      const doubtKeywords = userDoubts.map(doubt => doubt.question).join(", ");
      console.log("User doubts:", doubtKeywords);


      const formattedResults = chromadbResults.map((item, index) => `${index + 1}. ${item}`).join("\n");
      console.log("formatedd results:",formattedResults)

      const prompt = `
      You are an advanced AI assistant for personalized course recommendations.  
      
      ### User's Past Doubts:
      ${doubtKeywords ? doubtKeywords : "No past doubts available."}
      
      ### Retrieved Course Recommendations:
      ${formattedResults}
      
      ### User Query:
      "${userQuery}"
      
      ### Instructions:
      - Analyze the **user's past doubts** to understand their challenges and learning gaps.  
      - Consider the **retrieved courses** and evaluate them based on their **relevance**, **features**, and **ability to address past doubts**.  
      - Recommend the **best course** that aligns with both **past doubts** and **current query**.  
      - Justify your recommendation with a detailed explanation, ensuring that the course helps resolve the user's previous doubts.  
      - If multiple courses are equally good, provide a **ranked list** with reasons.
      `;


      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      const response = await model.generateContent(prompt);
      console.log("response:",response);
      return response.response.text(); 
  } catch (error) {
      console.error("Bard API Error:", error);
      return "Error fetching recommendations.";
  }
}
export {storeProductInChroma,getSmartRecommendations,getBardRecommendation}
