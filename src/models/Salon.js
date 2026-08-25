import mongoose from "mongoose";
const salonSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        image: String,
        address: String,
        city: String,
        phone: String,
        email: String,
        manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, default: 4.8 },
        reviewCount: { type: Number, default: 0 },
        workingHours: [
            { day: Number, open: String, close: String, closed: Boolean },
        ],
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true },
);
export default mongoose.model("Salon", salonSchema);
