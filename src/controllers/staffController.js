import Staff from "../models/Staff.js";
import Salon from "../models/Salon.js";
import Service from "../models/Service.js";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function scopeSalon(req, filter) {
    if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
    else if (req.query.salon) filter.salon = req.query.salon;
    return filter;
}

function parseTimeMinutes(value) {
    if (!value) return null;
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value).trim());
    if (!match) return null;
    const [hours, minutes] = match.slice(1).map(Number);
    return hours * 60 + minutes;
}

function normalizeWorkingHours(hours = []) {
    const defaults = dayNames.map((_, day) => ({ day, open: "", close: "", closed: day === 0 }));
    const entries = Array.isArray(hours) ? hours : [];
    const map = new Map(entries.map((item) => [Number(item.day), item]));
    return defaults.map((entry) => {
        const saved = map.get(entry.day);
        if (!saved) return { ...entry };
        const open = saved.open || "";
        const close = saved.close || "";
        const closed = Boolean(saved.closed);
        return {
            day: entry.day,
            open: closed ? "" : open,
            close: closed ? "" : close,
            closed,
        };
    });
}

function validateWorkingHours(hours) {
    if (!Array.isArray(hours) || hours.length !== 7) {
        return "Working hours must include all seven days.";
    }

    for (const item of hours) {
        const day = Number(item?.day);
        if (!Number.isInteger(day) || day < 0 || day > 6) {
            return "Working hour day values are invalid.";
        }

        if (item.closed) continue;

        const open = String(item.open || "").trim();
        const close = String(item.close || "").trim();

        if (!open || !close) {
            return `${dayNames[day]} must include both open and close times when it is open.`;
        }

        const openMinutes = parseTimeMinutes(open);
        const closeMinutes = parseTimeMinutes(close);

        if (openMinutes === null || closeMinutes === null) {
            return `${dayNames[day]} has an invalid time range.`;
        }

        if (openMinutes >= closeMinutes) {
            return `${dayNames[day]} open time must be earlier than the close time.`;
        }
    }

    return null;
}

async function ensureValidServices(salonId, serviceIds = []) {
    const ids = [...new Set((serviceIds || []).filter(Boolean).map((id) => String(id)))];
    if (!ids.length) {
        return "Please select at least one service for this staff member.";
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
        return "Selected salon does not exist.";
    }

    const validServices = await Service.find({ _id: { $in: ids }, salon: salonId, status: "active" }).select("_id");
    if (validServices.length !== ids.length) {
        return "One or more selected services are invalid for the selected salon.";
    }

    return null;
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
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
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
        if (["manager", "owner"].includes(req.user.role)) payload.salon = req.user.salonId;
        if (!payload.salon)
            return res.status(422).json({ success: false, message: "Salon is required" });

        const serviceError = await ensureValidServices(payload.salon, payload.services);
        if (serviceError)
            return res.status(422).json({ success: false, message: serviceError });

        const hoursError = validateWorkingHours(normalizeWorkingHours(payload.workingHours));
        if (hoursError)
            return res.status(422).json({ success: false, message: hoursError });

        const staff = await Staff.create({
            ...payload,
            services: payload.services || [],
            workingHours: normalizeWorkingHours(payload.workingHours),
            leaves: payload.leaves || [],
        });
        res.status(201).json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}

export async function updateStaff(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;

        const current = await Staff.findOne(filter);
        if (!current)
            return res.status(404).json({ success: false, message: "Staff member not found" });

        const updates = { ...req.body };
        const nextSalon = ["manager", "owner"].includes(req.user.role) ? current.salon : (updates.salon || current.salon);
        if (!nextSalon)
            return res.status(422).json({ success: false, message: "Salon is required" });

        if (["manager", "owner"].includes(req.user.role)) delete updates.salon;

        const serviceIds = Array.isArray(updates.services) ? updates.services : current.services || [];
        const serviceError = await ensureValidServices(nextSalon, serviceIds);
        if (serviceError)
            return res.status(422).json({ success: false, message: serviceError });

        const workingHours = Array.isArray(updates.workingHours) ? updates.workingHours : current.workingHours || [];
        const hoursError = validateWorkingHours(normalizeWorkingHours(workingHours));
        if (hoursError)
            return res.status(422).json({ success: false, message: hoursError });

        const staff = await Staff.findOneAndUpdate(
            filter,
            {
                ...updates,
                salon: nextSalon,
                services: serviceIds,
                workingHours: normalizeWorkingHours(workingHours),
            },
            {
                new: true,
                runValidators: true,
            },
        );
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
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const staff = await Staff.findOneAndDelete(filter);
        if (!staff)
            return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (e) {
        next(e);
    }
}
