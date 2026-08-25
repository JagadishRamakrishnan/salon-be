import Salon from "../models/Salon.js";

export async function adminListSalons(req, res, next) {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search)
            filter.$or = [
                { name: new RegExp(search, "i") },
                { city: new RegExp(search, "i") },
            ];
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Salon.find(filter)
                .populate("manager", "name email")
                .sort("-createdAt")
                .skip(skip)
                .limit(Number(limit)),
            Salon.countDocuments(filter),
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

export async function createSalon(req, res, next) {
    try {
        const salon = await Salon.create(req.body);
        res.status(201).json({ success: true, data: salon });
    } catch (e) {
        next(e);
    }
}

export async function updateSalon(req, res, next) {
    try {
        const salon = await Salon.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!salon)
            return res.status(404).json({ success: false, message: "Salon not found" });
        res.json({ success: true, data: salon });
    } catch (e) {
        next(e);
    }
}

export async function deleteSalon(req, res, next) {
    try {
        const salon = await Salon.findByIdAndDelete(req.params.id);
        if (!salon)
            return res.status(404).json({ success: false, message: "Salon not found" });
        res.json({ success: true, data: salon });
    } catch (e) {
        next(e);
    }
}
