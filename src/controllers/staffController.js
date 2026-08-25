import Staff from "../models/Staff.js";

function scopeSalon(req, filter) {
    if (req.user.role === "manager") filter.salon = req.user.salonId;
    else if (req.query.salon) filter.salon = req.query.salon;
    return filter;
}

export async function listStaff(req, res, next) {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const filter = scopeSalon(req, {});
        if (status) filter.status = status;
        if (search)
            filter.$or = [
                { name: new RegExp(search, "i") },
                { specialty: new RegExp(search, "i") },
                { email: new RegExp(search, "i") },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Staff.find(filter)
                .populate("salon", "name city")
                .populate("services", "name")
                .sort("-createdAt")
                .skip(skip)
                .limit(Number(limit)),
            Staff.countDocuments(filter),
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

export async function getStaff(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role === "manager") filter.salon = req.user.salonId;
        const staff = await Staff.findOne(filter)
            .populate("salon", "name city")
            .populate("services", "name price");
        if (!staff)
            return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}

export async function createStaff(req, res, next) {
    try {
        const payload = { ...req.body };
        if (req.user.role === "manager") payload.salon = req.user.salonId;
        if (!payload.salon)
            return res.status(422).json({ success: false, message: "Salon is required" });
        const staff = await Staff.create(payload);
        res.status(201).json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}

export async function updateStaff(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role === "manager") filter.salon = req.user.salonId;
        const updates = { ...req.body };
        if (req.user.role === "manager") delete updates.salon;
        const staff = await Staff.findOneAndUpdate(filter, updates, {
            new: true,
            runValidators: true,
        });
        if (!staff)
            return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}

export async function deleteStaff(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role === "manager") filter.salon = req.user.salonId;
        const staff = await Staff.findOneAndDelete(filter);
        if (!staff)
            return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}
