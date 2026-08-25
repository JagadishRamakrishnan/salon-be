import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

export async function listCustomers(req, res, next) {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const filter = { role: "customer" };
        if (status) filter.status = status;
        if (search)
            filter.$or = [
                { name: new RegExp(search, "i") },
                { email: new RegExp(search, "i") },
                { phone: new RegExp(search, "i") },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            User.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)),
            User.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: items,
            pagination: { page: Number(page), limit: Number(limit), total },
        });
    } catch (e) {
        next(e);
    }
}

export async function getCustomer(req, res, next) {
    try {
        const customer = await User.findOne({ _id: req.params.id, role: "customer" });
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found" });
        const appointments = await Appointment.find({ customer: customer._id })
            .populate("service", "name")
            .populate("staff", "name")
            .populate("salon", "name")
            .sort("-date");
        res.json({ success: true, data: { customer, appointments } });
    } catch (e) {
        next(e);
    }
}

export async function updateCustomer(req, res, next) {
    try {
        const { name, phone, status } = req.body;
        const customer = await User.findOneAndUpdate(
            { _id: req.params.id, role: "customer" },
            { name, phone, status },
            { new: true, runValidators: true },
        );
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found" });
        res.json({ success: true, data: customer });
    } catch (e) {
        next(e);
    }
}

export async function deleteCustomer(req, res, next) {
    try {
        const customer = await User.findOneAndUpdate(
            { _id: req.params.id, role: "customer" },
            { status: "inactive" },
            { new: true },
        );
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found" });
        res.json({ success: true, data: customer });
    } catch (e) {
        next(e);
    }
}
