import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
export async function listSalons(req, res, next) {
    try {
        const query = req.query.search
            ? {
                status: "active",
                $or: [
                    { name: new RegExp(req.query.search, "i") },
                    { city: new RegExp(req.query.search, "i") },
                ],
            }
            : { status: "active" };
        res.json({ success: true, data: await Salon.find(query).sort("-rating") });
    } catch (e) {
        next(e);
    }
}
export async function getSalon(req, res, next) {
    try {
        if (["manager", "owner"].includes(req.user?.role) && String(req.user.salonId) !== req.params.id)
            return res.status(403).json({ success: false, message: "Access denied for this salon" });
        const salon = await Salon.findById(req.params.id).populate(
            "manager",
            "name email",
        );
        if (!salon)
            return res
                .status(404)
                .json({ success: false, message: "Salon not found" });
        const [services, staff] = await Promise.all([
            Service.find({ salon: salon._id, status: "active" }).populate(
                "category",
                "name",
            ),
            Staff.find({ salon: salon._id, status: "active" }),
        ]);
        res.json({ success: true, data: { salon, services, staff } });
    } catch (e) {
        next(e);
    }
}
export async function dashboard(req, res, next) {
    try {
        const salonId = ["manager", "owner"].includes(req.user.role) ? req.user.salonId : req.query.salon;
        if (!salonId)
            return res.status(422).json({ success: false, message: "Salon is required" });
        const [salon, services, staff] = await Promise.all([
            Salon.findById(salonId),
            Service.countDocuments({ salon: salonId, status: "active" }),
            Staff.countDocuments({ salon: salonId, status: "active" }),
        ]);
        res.json({ success: true, data: { salon, services, staff } });
    } catch (e) {
        next(e);
    }
}
