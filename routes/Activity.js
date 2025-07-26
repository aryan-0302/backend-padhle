import express from "express"
import { track } from "../controllers/UserAct.js";
const router = express.Router();


router.post("/track",track)

export default router