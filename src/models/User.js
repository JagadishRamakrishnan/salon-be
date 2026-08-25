import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: { type: String, trim: true },
        password: { type: String, required: true, select: false },
        role: {
            type: String,
            enum: ["customer", "manager", "admin"],
            default: "customer",
        },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon" },
    },
    { timestamps: true },
);
export default mongoose.model("User", userSchema);
