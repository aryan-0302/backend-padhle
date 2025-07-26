import UserActivity from "../models/UserActivity.js";

const track=async(req,res)=>{
  try {
    const { userId, productId, eventType, status } = req.body;  
    // status can be "start", "end", or "update"

    if (!userId || !productId || !eventType || !status) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (status === "start") {
        // Start tracking
        const activity = new UserActivity({
            userId,
            productId,
            eventType,
            startTime: new Date(),
        });

        await activity.save();
        return res.status(200).json({ success: true, message: "Tracking started" });

    } else if (status === "end") {
        // End tracking and calculate time spent
        const activity = await UserActivity.findOne({
            userId,
            productId,
            eventType,
        }).sort({ startTime: -1 }); 

        if (!activity || activity.endTime) {
            return res.status(400).json({ success: false, message: "No active session found" });
        }

        activity.endTime = new Date();
        activity.timeSpent = (activity.endTime - activity.startTime) / 1000; // Convert to seconds
        await activity.save();

        return res.status(200).json({ success: true, timeSpent: activity.timeSpent });

    } else if (status === "update") {
        // Update the time spent dynamically
        const activity = await UserActivity.findOne({
            userId,
            productId,
            eventType,
        }).sort({ startTime: -1 });

        if (!activity) {
            return res.status(400).json({ success: false, message: "No active session found" });
        }

        activity.timeSpent = (new Date() - activity.startTime) / 1000; // Update time spent dynamically
        await activity.save();

        return res.status(200).json({ success: true, timeSpent: activity.timeSpent });
    }

    return res.status(400).json({ success: false, message: "Invalid status type" });

} catch (error) {
    res.status(500).json({ success: false, error: error.message });
}
}
export {track}