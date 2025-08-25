import express from "express"
const app=express();

import userRoutes from "./routes/User.js"
import paymentRoutes from "./routes/Payment.js"
import profileRoutes from "./routes/Profile.js"
import CourseRoutes from "./routes/Course.js"

import activityTrack from "./routes/Activity.js"
import recommendRoutes from "./routes/RecommendRoutes.js";

import dbConnect from "./config/db.js"

import cookieParser from "cookie-parser";
import cors from "cors"
import fileUpload from "express-fileupload"
import cloudinaryconnect from "./config/Cloudinary.js"
import generatequiz from "./routes/GenerateQuiz.js"
import smartNotes from "./routes/SmartNotes.js"
import doubtRoutes from "./routes/doubtRoutes.js"

app.use(cors({
  origin: 'https://frontend-padhle-prks.vercel.app', // your frontend
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

import dotenv from "dotenv"
dotenv.config();


import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyBPx7qBZz0TJiEz1KYteNdAZMqib6GdWD0");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


const PORT = process.env.PORT || 5000;
dbConnect();

app.use(express.json());
app.use(cookieParser());

// CORS is used to interact frontend and backend hosted at different port/domain.
// When your frontend (React) makes an API request to the backend (Express) using Axios (or any other HTTP client),
// this is considered a cross-origin request. The browser will block this request unless the backend explicitly allows it through CORS.


app.use(fileUpload({
  useTempFiles:true,
  tempFileDir:'/tmp/'
}));

cloudinaryconnect();


app.use("/api/v1/auth", userRoutes); 
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", CourseRoutes);
 
app.use("/api/v1/activity",activityTrack)

app.use("/api/v1/recommend",recommendRoutes);  
app.use("/api/v1/generatequiz",generatequiz);
app.use("/api/v1/notes",smartNotes);
app.use("/api/v1/doubt", doubtRoutes);


const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

const sendMessageStream = async (prompt) => {
  try {
    let responseText = "";
    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText); 
      responseText += chunkText;
    }

    console.log("\n"); 
    return responseText;
  } catch (err) {
    console.error("Error:", err);
    return "Error generating response.";
  }
};


app.post("/api/generate-content",async (req,res)=>{
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }
    
    const response = await sendMessageStream(input);
    res.json({ candidates: [{ content: { parts: [{ text: response }] } }] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})



app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the API",
  });
});
  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




// IMPORTANT POINTS:
/*
1. Client sends request to DNR(domain name resolution)which finds the exact address of server(as there are many servers, which further sends request to server and server responds according to it to client.
2. NodeJS provides runtime environment(earlier we can only run in browser but now due to nodejs we can run javascript code through client side also).
3. before nodemon: node index.js, after nodemon dev:"nodemon index.js" and npm run dev
4. Middleware: validate,log,authentication,authorize the request before responds.
5. There are 5 types of middlewares: a).Application-level middleware(jo banaye he)   b).Built-in(app.use(express.json())    c).Third Party middleware(app.use(cookieParser()))
    d). router middleware(router.use())     e).error-handling middleware     f).Route-specific middleware(for industry)

6. MongoDB: No SQL database,in which data stored in document or json like structure. wheereas in SQL data is stored in every new row.s
7. DUe to easy integation,scalibility.
8. In mongoDB compass, there can be several collection and each collection can have several documents.
9. Backend application interact with the database through the mongoose.
10. Mongoose is a ODM(object data modelling) library.
11. Schema is the blueprint of the document.
12. Model is a toolbox that uses schema to do CRUD operations in DB.
13. MVC(mode view controller) pattern(in which our project flow is there) follows SOC(separation of concerns)
*/ 









/*
AI agent integration:STEPS:
1.Data collection(user interaction Tracking):
  ->Time spent on a page
  ->Products views
  ->Search queries
  ->Cart additions
  ->Purchase history(buy products)

2.Storing data in a vector database(pinecone,FAISS(facebook)).
3.AI recommendation engine:using user's browser history to generate personalized recommendations.
4.AI agent for smart recommendation:it analyzes user behaviour and adjusts recommendation dynamically.
5.Showing recommendations on UI.
*/
