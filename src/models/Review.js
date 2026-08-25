import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
    {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon" },
        staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            unique: true,
        },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        status: { type: String, default: "published" },
    },
    { timestamps: true },
);
export default mongoose.model("Review", reviewSchema);
