import express from "express";
import generateSmartNotes  from "../controllers/smartNotesController.js";

const router = express.Router();

router.post("/generate-smart-notes/:subsectionId", generateSmartNotes);

export default router;
