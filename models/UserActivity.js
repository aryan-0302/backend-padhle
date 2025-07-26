import mongoose from "mongoose";

const UserActivitySchema = new mongoose.Schema({
    userId: String,
    eventType: { type: String, enum: ["view", "wishlist", "cart"], required: true },
    productId: String, // to view purchase history(buy)
    startTime: { type: Date }, // When the user starts viewing
    endTime: { type: Date },   // When the user leaves
    timeSpent: { type: Number, default: 0 }
});
const UserActivity=mongoose.model("UserActivity",UserActivitySchema);
export default UserActivity;
