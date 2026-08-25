import mongoose from "mongoose";
const appointmentSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        salon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salon",
            required: true,
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true,
        },
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        price: Number,
        notes: String,
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true },
);
appointmentSchema.index({ staff: 1, date: 1, status: 1 });
export default mongoose.model("Appointment", appointmentSchema);
