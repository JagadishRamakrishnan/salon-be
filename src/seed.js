import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Salon from "./models/Salon.js";
import Category from "./models/Category.js";
import Service from "./models/Service.js";
import Staff from "./models/Staff.js";
await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/salon_platform",
);
await Promise.all([
    User.deleteMany({}),
    Salon.deleteMany({}),
    Category.deleteMany({}),
    Service.deleteMany({}),
    Staff.deleteMany({}),
]);
const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: "09:00",
    close: "19:00",
    closed: day === 0,
}));
const salon = await Salon.create({
    name: "Maison Lumiere",
    description: "A considered space for modern beauty rituals.",
    image:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    address: "18 Rosewood Avenue",
    city: "Bengaluru",
    phone: "+91 80 4567 8900",
    email: "hello@maisonlumiere.com",
    workingHours: hours,
    rating: 4.9,
    reviewCount: 128,
});
const password = await bcrypt.hash("Password123", 12);
const manager = await User.create({
    name: "Ava Laurent",
    email: "manager@maisonlumiere.com",
    password,
    role: "manager",
    salon: salon._id,
});
salon.manager = manager._id;
await salon.save();
await User.create({
    name: "Maya Customer",
    email: "customer@example.com",
    phone: "+91 98765 43210",
    password,
    role: "customer",
});
await User.create({
    name: "Platform Admin",
    email: "admin@salon.com",
    password,
    role: "admin",
});
const [hair, skin] = await Category.create([
    { name: "Hair" },
    { name: "Skin" },
]);
const staff = await Staff.create([
    {
        name: "Sofia Bennett",
        specialty: "Cut & Colour Specialist",
        salon: salon._id,
        workingHours: hours,
        rating: 4.9,
    },
    {
        name: "Nia Kapoor",
        specialty: "Skin & Wellness Expert",
        salon: salon._id,
        workingHours: hours,
        rating: 4.8,
    },
]);
await Service.create([
    {
        name: "Signature Cut & Finish",
        category: hair._id,
        salon: salon._id,
        staff: [staff[0]._id],
        price: 1800,
        duration: 60,
        description: "A tailored cut, wash and finish.",
    },
    {
        name: "Luminous Facial",
        category: skin._id,
        salon: salon._id,
        staff: [staff[1]._id],
        price: 2200,
        duration: 75,
        description: "A restorative facial for fresh, luminous skin.",
    },
    {
        name: "Gloss & Tone",
        category: hair._id,
        salon: salon._id,
        staff: [staff[0]._id],
        price: 2500,
        duration: 90,
        description: "A dimensional gloss that catches the light.",
    },
]);
console.log("Seed complete. Demo passwords: Password123");
await mongoose.disconnect();
