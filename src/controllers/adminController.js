import User from "../models/User.js";
import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
export async function stats(req, res, next) {
    try {
        const [customers, salons, managers, staff, services, appointments] =
            await Promise.all([
                User.countDocuments({ role: "customer" }),
                Salon.countDocuments(),
                User.countDocuments({ role: "manager" }),
                Staff.countDocuments(),
                Service.countDocuments(),
                Appointment.countDocuments(),
            ]);
        res.json({
            success: true,
            data: { customers, salons, managers, staff, services, appointments },
        });
    } catch (e) {
        next(e);
    }
}
