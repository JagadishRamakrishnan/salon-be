import mongoose from "mongoose";
const serviceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        price: { type: Number, required: true },
        duration: { type: Number, required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        salon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salon",
            required: true,
        },
        staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true },
);
serviceSchema.index({ salon: 1, status: 1 });
export default mongoose.model("Service", serviceSchema);
