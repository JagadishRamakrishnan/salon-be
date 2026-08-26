import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Salon from "../models/Salon.js";

const managerFields = "name email phone role status salon createdAt";
const roleForRequest = (req) => req.path.startsWith("/owners") ? "owner" : "manager";

function filters(req) {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = { role: roleForRequest(req) };
    if (status) filter.status = status;
    if (search)
        filter.$or = [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
            { phone: new RegExp(search, "i") },
        ];
    return { filter, page: Number(page), limit: Number(limit) };
}

async function validSalon(id) {
    return id && Salon.findOne({ _id: id, status: "active" });
}

export async function listManagers(req, res, next) {
    try {
        const { filter, page, limit } = filters(req);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            User.find(filter).select(managerFields).populate("salon", "name city status")
                .sort("-createdAt").skip(skip).limit(limit),
            User.countDocuments(filter),
        ]);
        res.json({ success: true, data: items, pagination: { page, limit, total } });
    } catch (error) { next(error); }
}

export async function getManager(req, res, next) {
    try {
        const manager = await User.findOne({ _id: req.params.id, role: roleForRequest(req) })
            .select(managerFields).populate("salon", "name city status");
        if (!manager) return res.status(404).json({ success: false, message: "Manager not found" });
        res.json({ success: true, data: manager });
    } catch (error) { next(error); }
}

export async function createManager(req, res, next) {
    try {
        const { name, email, phone, password, salon, status = "active" } = req.body;
        if (!name || !email || !password || password.length < 6 || !salon)
            return res.status(422).json({ success: false, message: "Name, email, 6+ character password and salon are required" });
        if (await User.findOne({ email: email.toLowerCase() }))
            return res.status(409).json({ success: false, message: "Email is already registered" });
        if (!(await validSalon(salon)))
            return res.status(422).json({ success: false, message: "Select an active salon" });
        if (await User.exists({ role: roleForRequest(req), salon }))
            return res.status(409).json({ success: false, message: "This salon already has an assigned account of this type" });
        const manager = await User.create({ name, email, phone, status, role: roleForRequest(req), salon, password: await bcrypt.hash(password, 12) });
        await Salon.findByIdAndUpdate(salon, { manager: manager._id });
        res.status(201).json({ success: true, data: await User.findById(manager._id).select(managerFields).populate("salon", "name city status") });
    } catch (error) { next(error); }
}

export async function updateManager(req, res, next) {
    try {
        const manager = await User.findOne({ _id: req.params.id, role: roleForRequest(req) });
        if (!manager) return res.status(404).json({ success: false, message: "Manager not found" });
        const { name, email, phone, password, salon, status } = req.body;
        if (salon && !(await validSalon(salon)))
            return res.status(422).json({ success: false, message: "Select an active salon" });
        const oldSalon = manager.salon;
        if (salon && String(oldSalon) !== String(salon) && await User.exists({ _id: { $ne: manager._id }, role: roleForRequest(req), salon }))
            return res.status(409).json({ success: false, message: "This salon already has an assigned account of this type" });
        Object.assign(manager, { name, email, phone, salon, status });
        if (password) {
            if (password.length < 6) return res.status(422).json({ success: false, message: "Password must be at least 6 characters" });
            manager.password = await bcrypt.hash(password, 12);
        }
        await manager.save();
        if (oldSalon && String(oldSalon) !== String(salon)) await Salon.findByIdAndUpdate(oldSalon, { $unset: { manager: 1 } });
        await Salon.findByIdAndUpdate(salon, { manager: manager._id });
        res.json({ success: true, data: await User.findById(manager._id).select(managerFields).populate("salon", "name city status") });
    } catch (error) { next(error); }
}

export async function updateManagerStatus(req, res, next) {
    try {
        if (!["active", "inactive"].includes(req.body.status))
            return res.status(422).json({ success: false, message: "Invalid manager status" });
        const manager = await User.findOneAndUpdate(
            { _id: req.params.id, role: roleForRequest(req) },
            { status: req.body.status },
            { new: true, runValidators: true },
        ).select(managerFields).populate("salon", "name city status");
        if (!manager)
            return res.status(404).json({ success: false, message: "Manager not found" });
        res.json({ success: true, data: manager });
    } catch (error) { next(error); }
}

export async function deleteManager(req, res, next) {
    try {
        const manager = await User.findOneAndDelete({ _id: req.params.id, role: roleForRequest(req) });
        if (!manager) return res.status(404).json({ success: false, message: "Manager not found" });
        await Salon.findByIdAndUpdate(manager.salon, { $unset: { manager: 1 } });
        res.json({ success: true, data: manager });
    } catch (error) { next(error); }
}
