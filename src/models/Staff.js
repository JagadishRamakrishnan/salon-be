import mongoose from "mongoose";
const staffSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        photo: String,
        specialty: String,
        phone: String,
        email: String,
        salon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salon",
            required: true,
        },
        services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
        workingHours: [
            { day: Number, open: String, close: String, closed: Boolean },
        ],
        leaves: [{
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            startTime: String,
            endTime: String,
            reason: String,
            status: { type: String, enum: ["active", "cancelled"], default: "active" },
        }],
        rating: { type: Number, default: 4.9 },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true },
);
export default mongoose.model("Staff", staffSchema);
