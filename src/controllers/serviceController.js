import Service from "../models/Service.js";

function scopeSalon(req, filter) {
    if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
    else if (req.query.salon) filter.salon = req.query.salon;
    return filter;
}

export async function listServices(req, res, next) {
    try {
        const { search, status, category, page = 1, limit = 10 } = req.query;
        const filter = { status: "active" };
        if (req.user && ["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        else if (req.query.salon) filter.salon = req.query.salon;
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (search) filter.name = new RegExp(search, "i");
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Service.find(filter)
                .populate("category", "name")
                .populate("salon", "name city image")
                .sort("-createdAt")
                .skip(skip)
                .limit(Number(limit)),
            Service.countDocuments(filter),
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

export async function getService(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const service = await Service.findOne(filter)
            .populate("category", "name")
            .populate("salon", "name city")
            .populate("staff", "name");
        if (!service)
            return res.status(404).json({ success: false, message: "Service not found" });
        res.json({ success: true, data: service });
    } catch (e) {
        next(e);
    }
}

export async function createService(req, res, next) {
    try {
        const payload = { ...req.body };
        if (["manager", "owner"].includes(req.user.role)) payload.salon = req.user.salonId;
        if (!payload.salon)
            return res.status(422).json({ success: false, message: "Salon is required" });
        const service = await Service.create(payload);
        res.status(201).json({ success: true, data: service });
    } catch (e) {
        next(e);
    }
}

export async function updateService(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const updates = { ...req.body };
        if (["manager", "owner"].includes(req.user.role)) delete updates.salon;
        const service = await Service.findOneAndUpdate(filter, updates, {
            new: true,
            runValidators: true,
        });
        if (!service)
            return res.status(404).json({ success: false, message: "Service not found" });
        res.json({ success: true, data: service });
    } catch (e) {
        next(e);
    }
}

export async function deleteService(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const service = await Service.findOneAndDelete(filter);
        if (!service)
            return res.status(404).json({ success: false, message: "Service not found" });
        res.json({ success: true, data: service });
    } catch (e) {
        next(e);
    }
}
