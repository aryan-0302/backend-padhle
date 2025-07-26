import SubSection from "../models/SubSection.js"
import Section from "../models/Section.js"
import uploadImageToCloudinary from "../utils/imageUploader.js"
import Course from "../models/Course.js";
import axios from "axios";
import fs from "fs"
import ffmpeg from "fluent-ffmpeg"


const createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description, courseId } = req.body;
        const video = req.files?.videoFile;

        if (!sectionId || !title || !description || !video || !courseId) {
            return res.status(400).json({ success: false, message: "All Fields are Required" });
        }

        const ifsection = await Section.findById(sectionId);
        if (!ifsection) {
            return res.status(404).json({ success: false, message: "Section not found" });
        }

        // Upload video to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_VIDEO);
        console.log("Uploaded video details:", uploadDetails);

        const videoUrl = uploadDetails.secure_url;
        const videoPath = "temp_video.mp4";
        const audioPath = "temp_audio.mp3";

        // Download video from Cloudinary
        const response = await axios({ method: 'GET', url: videoUrl, responseType: 'stream' });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        // Wait for video download to complete
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Extract audio using FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .output(audioPath)
                .noVideo()
                .audioCodec("libmp3lame")
                .on("end", resolve)
                .on("error", reject)
                .run();
        });

        console.log("Audio extracted successfully");
		const audioFile = { tempFilePath: audioPath };

        // Upload audio to Cloudinary
        const audioUpload = await uploadImageToCloudinary(audioFile, process.env.FOLDER_AUDIO);
        console.log("Uploaded audio details:", audioUpload);



         // Step 2: Upload audio to AssemblyAI for transcription
    const assemblyApiKey = process.env.ASSEMBLY_API_KEY;
    const assemblyUploadResponse = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        fs.createReadStream(audioPath),
        { headers: { Authorization: assemblyApiKey, "Content-Type": "application/octet-stream" } }
    );

    const audioUrl = assemblyUploadResponse.data.upload_url;
    console.log("Uploaded audio to AssemblyAI:", audioUrl);

    // Step 3: Request transcription
    const transcriptResponse = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        { audio_url: audioUrl },
        { headers: { Authorization: assemblyApiKey, "Content-Type": "application/json" } }
    );

    const transcriptId = transcriptResponse.data.id;
    console.log("Transcription started, ID:", transcriptId);

    // Step 4: Fetch transcription result
    let transcriptText = "";
    let status = "processing";
    while (status === "processing") {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 sec
        const transcriptData = await axios.get(
            `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
            { headers: { Authorization: assemblyApiKey } }
        );
        console.log("transcipt data:",transcriptData);
        status = transcriptData.data.status;
        if (status === "completed") {
            transcriptText = transcriptData.data.text;
            console.log("Transcription completed:", transcriptText);
        } else if (status === "failed") {
            console.error("Transcription failed.");
            return res.status(500).json({ success: false, message: "Transcription failed" });
        }
    }




        // Remove temporary files
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (err) {
            console.error("Error cleaning up temp files:", err);
        }

        // Create subsection entry
		const SubSectionDetails = await SubSection.create({
			title: title,
			description: description,
			videoUrl: uploadDetails.secure_url,
            transcript:transcriptText
		});

        // Update section with new subsection
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection");

        const updatedCourse = await Course.findById(courseId)
            .populate({ path: "courseContent", populate: { path: "subSection" } })
            .exec();

        return res.status(200).json({ success: true, data: updatedCourse });

    } catch (error) {
        console.error("Error creating new sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export { createSubSection };







// UPDATED SUBSECTION:
const updateSubSection = async (req,res) => {

	try {
		// Extract necessary information from the request body
		const { SubsectionId, title , description,courseId } = req.body;
		const video = req?.files?.videoFile;

		
		let uploadDetails = null;
		// Upload the video file to Cloudinary
		if(video){
		 uploadDetails = await uploadImageToCloudinary(
			video,
			process.env.FOLDER_VIDEO
		);
		}

		// Create a new sub-section with the necessary information
		const SubSectionDetails = await SubSection.findByIdAndUpdate({_id:SubsectionId},{
			title: title || SubSection.title,
			// timeDuration: timeDuration,
			description: description || SubSection.description,
			videoUrl: uploadDetails?.secure_url || SubSection.videoUrl,
		},{ new: true });

		
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		// Return the updated section in the response
		return res.status(200).json({ success: true, data: updatedCourse });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}

}
export {updateSubSection}





// DELETE SUBSECTION:
const deleteSubSection = async(req, res) => {

	try {
		const {subSectionId,courseId} = req.body;
		const sectionId=req.body.sectionId;
	if(!subSectionId || !sectionId){
		return res.status(404).json({
            success: false,
            message: "all fields are required",
        });
	}
	const ifsubSection = await SubSection.findById({_id:subSectionId});
	const ifsection= await Section.findById({_id:sectionId});
	if(!ifsubSection){
		return res.status(404).json({
            success: false,
            message: "Sub-section not found",
        });
	}
	if(!ifsection){
		return res.status(404).json({
            success: false,
            message: "Section not found",
        });
    }
	await SubSection.findByIdAndDelete(subSectionId);
	await Section.findByIdAndUpdate({_id:sectionId},{$pull:{subSection:subSectionId}},{new:true});
	const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
	return res.status(200).json({ success: true, message: "Sub-section deleted", data: updatedCourse });
		
	} catch (error) {
		// Handle any errors that may occur during the process
        console.error("Error deleting sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
		
	}
};
export {deleteSubSection}