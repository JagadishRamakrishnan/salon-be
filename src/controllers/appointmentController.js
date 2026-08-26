import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import Salon from "../models/Salon.js";
function minutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
function scheduleForDay(items, day) {
    const item = items?.find((entry) => entry.day === day);
    return item && !item.closed && item.open && item.close ? item : null;
}
function leaveCovers(person, date, start, end) {
    const day = new Date(`${date}T00:00:00`);
    return (person.leaves || []).some((leave) => {
        if (leave.status === "cancelled") return false;
        const from = new Date(leave.startDate); from.setHours(0, 0, 0, 0);
        const to = new Date(leave.endDate); to.setHours(23, 59, 59, 999);
        if (day < from || day > to) return false;
        return !leave.startTime || (minutes(start) < minutes(leave.endTime || "23:59") && minutes(end) > minutes(leave.startTime));
    });
}
async function validateWindow(salonId, person, treatment, date, startTime, endTime) {
    const requested = new Date(`${date}T00:00:00`);
    if (Number.isNaN(requested.getTime()) || requested < new Date(new Date().toDateString())) return "Appointments must be booked for today or later";
    if (!Number.isFinite(treatment.duration) || treatment.duration <= 0) return "Service duration is invalid";
    const salon = await Salon.findById(salonId, "workingHours");
    const salonHours = scheduleForDay(salon?.workingHours, requested.getDay());
    const staffHours = scheduleForDay(person.workingHours, requested.getDay());
    if (!salonHours || !staffHours) return "The salon or staff member is closed on this day";
    if (minutes(startTime) < Math.max(minutes(salonHours.open), minutes(staffHours.open)) || minutes(endTime) > Math.min(minutes(salonHours.close), minutes(staffHours.close))) return "The selected time is outside working hours";
    if (leaveCovers(person, date, startTime, endTime)) return "This staff member is on leave at that time";
    return null;
}
export async function availability(req, res, next) {
    try {
        const { staff, service, date } = req.query;
        const [person, treatment] = await Promise.all([
            Staff.findById(staff),
            Service.findById(service),
        ]);
        if (!person || !treatment)
            return res
                .status(404)
                .json({ success: false, message: "Staff or service not found" });
        if (["manager", "owner"].includes(req.user?.role) && (String(person.salon) !== String(req.user.salonId) || String(treatment.salon) !== String(req.user.salonId)))
            return res.status(403).json({ success: false, message: "Access denied for this salon" });
        const day = new Date(`${date}T00:00:00`).getDay();
        const hours = scheduleForDay(person.workingHours, day);
        const salon = await Salon.findById(treatment.salon, "workingHours");
        const salonHours = scheduleForDay(salon?.workingHours, day);
        if (!hours || !salonHours || new Date(`${date}T00:00:00`) < new Date(new Date().toDateString())) return res.json({ success: true, data: [] });
        const appointments = await Appointment.find({
            staff,
            date: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`),
            },
            status: { $nin: ["Cancelled"] },
        });
        const slots = [];
        for (
            let current = Math.max(minutes(hours.open), minutes(salonHours.open));
            current + treatment.duration <= Math.min(minutes(hours.close), minutes(salonHours.close));
            current += 30
        ) {
            const end = current + treatment.duration;
            if (!leaveCovers(person, date, `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`, `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`) &&
                !appointments.some(
                    (item) =>
                        current < minutes(item.endTime) && end > minutes(item.startTime),
                )
            )
                slots.push(
                    `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`,
                );
        }
        res.json({ success: true, data: slots });
    } catch (e) {
        next(e);
    }
}
export async function createAppointment(req, res, next) {
    try {
        const { service, staff, date, startTime } = req.body;
        const salon = ["manager", "owner"].includes(req.user.role) ? req.user.salonId : req.body.salon;
        const treatment = await Service.findOne({
            _id: service,
            salon,
            status: "active",
        });
        const person = await Staff.findOne({ _id: staff, salon, status: "active" });
        if (!treatment || !person)
            return res
                .status(400)
                .json({ success: false, message: "Service or staff is unavailable" });
        const start = minutes(startTime);
        const end = start + treatment.duration;
        const endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
        const windowError = await validateWindow(salon, person, treatment, date, startTime, endTime);
        if (windowError) return res.status(422).json({ success: false, message: windowError });
        const overlap = await Appointment.exists({
            staff,
            date: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`),
            },
            status: { $nin: ["Cancelled"] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        });
        if (overlap)
            return res
                .status(409)
                .json({
                    success: false,
                    message: "Appointment slot is no longer available",
                });
        const appointment = await Appointment.create({
            customer: req.user._id,
            salon,
            service,
            staff,
            date,
            startTime,
            endTime,
            price: treatment.price,
        });
        res
            .status(201)
            .json({
                success: true,
                data: await appointment.populate(["service", "staff", "salon"]),
            });
    } catch (e) {
        next(e);
    }
}
export async function myAppointments(req, res, next) {
    try {
        const filter =
            req.user.role === "customer"
                ? { customer: req.user._id }
                : { salon: req.user.salonId };
        res.json({
            success: true,
            data: await Appointment.find(filter)
                .populate("customer service staff salon")
                .sort("-date"),
        });
    } catch (e) {
        next(e);
    }
}
export async function cancelAppointment(req, res, next) {
    try {
        const appointment = await Appointment.findOneAndUpdate(
            {
                _id: req.params.id,
                customer: req.user._id,
                status: { $in: ["Pending", "Confirmed"] },
            },
            { status: "Cancelled" },
            { new: true },
        );
        if (!appointment)
            return res
                .status(400)
                .json({
                    success: false,
                    message: "This appointment cannot be cancelled",
                });
        res.json({ success: true, data: appointment });
    } catch (e) {
        next(e);
    }
}

/* ------------------------------------------------------------------ */
/* Admin / manager appointment management                              */
/* ------------------------------------------------------------------ */

function scopeSalon(req, filter) {
    if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
    else if (req.query.salon) filter.salon = req.query.salon;
    return filter;
}

export async function adminListAppointments(req, res, next) {
    try {
        const {
            status,
            staff,
            service,
            date,
            search,
            page = 1,
            limit = 10,
        } = req.query;
        const filter = scopeSalon(req, {});
        if (status) filter.status = status;
        if (staff) filter.staff = staff;
        if (service) filter.service = service;
        if (date)
            filter.date = {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`),
            };
        let query = Appointment.find(filter)
            .populate("customer", "name email phone")
            .populate("service", "name price")
            .populate("staff", "name")
            .populate("salon", "name city")
            .sort("-date -startTime");
        let items = await query;
        if (search) {
            const term = search.toLowerCase();
            items = items.filter(
                (item) =>
                    item.customer?.name?.toLowerCase().includes(term) ||
                    item.customer?.email?.toLowerCase().includes(term) ||
                    item.service?.name?.toLowerCase().includes(term) ||
                    item.staff?.name?.toLowerCase().includes(term),
            );
        }
        const total = items.length;
        const skip = (Number(page) - 1) * Number(limit);
        const paged = items.slice(skip, skip + Number(limit));
        res.json({
            success: true,
            data: paged,
            pagination: { page: Number(page), limit: Number(limit), total },
        });
    } catch (e) {
        next(e);
    }
}

export async function getAppointment(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const appointment = await Appointment.findOne(filter)
            .populate("customer", "name email phone")
            .populate("service", "name price duration")
            .populate("staff", "name specialty")
            .populate("salon", "name city");
        if (!appointment)
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        res.json({ success: true, data: appointment });
    } catch (e) {
        next(e);
    }
}

export async function adminCreateAppointment(req, res, next) {
    try {
        const { customer, service, staff, date, startTime, notes } =
            req.body;
        const salon = ["manager", "owner"].includes(req.user.role) ? req.user.salonId : req.body.salon;
        const [customerRecord, treatment, person] = await Promise.all([
            User.findById(customer),
            Service.findById(service),
            Staff.findById(staff),
        ]);
        if (!customerRecord || !treatment || !person)
            return res.status(400).json({
                success: false,
                message: "Customer, service or staff is invalid",
            });
        if (["manager", "owner"].includes(req.user.role) && (String(treatment.salon) !== String(salon) || String(person.salon) !== String(salon)))
            return res.status(403).json({ success: false, message: "Service and staff must belong to your salon" });
        const start = minutes(startTime);
        const end = start + treatment.duration;
        const endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
        const windowError = await validateWindow(salon, person, treatment, date, startTime, endTime);
        if (windowError) return res.status(422).json({ success: false, message: windowError });
        const overlap = await Appointment.exists({
            staff,
            date: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`),
            },
            status: { $nin: ["Cancelled"] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        });
        if (overlap)
            return res.status(409).json({
                success: false,
                message: "This staff member already has an appointment at that time",
            });
        const appointment = await Appointment.create({
            customer,
            salon,
            service,
            staff,
            date,
            startTime,
            endTime,
            price: treatment.price,
            notes,
        });
        res.status(201).json({
            success: true,
            data: await appointment.populate(["customer", "service", "staff", "salon"]),
        });
    } catch (e) {
        next(e);
    }
}

export async function updateAppointment(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const updates = { ...req.body };
        if (["manager", "owner"].includes(req.user.role)) delete updates.salon;
        if (["manager", "owner"].includes(req.user.role) && (updates.service || updates.staff)) {
            const [treatment, person] = await Promise.all([
                updates.service ? Service.findById(updates.service) : null,
                updates.staff ? Staff.findById(updates.staff) : null,
            ]);
            if (treatment && String(treatment.salon) !== String(req.user.salonId) || person && String(person.salon) !== String(req.user.salonId))
                return res.status(403).json({ success: false, message: "Service and staff must belong to your salon" });
            if (updates.service && !treatment || updates.staff && !person)
                return res.status(404).json({ success: false, message: "Service or staff not found" });
        }
        if (updates.service && updates.startTime) {
            const treatment = await Service.findById(updates.service);
            if (["manager", "owner"].includes(req.user.role) && (!treatment || String(treatment.salon) !== String(req.user.salonId)))
                return res.status(403).json({ success: false, message: "Service does not belong to your salon" });
            if (treatment) {
                const start = minutes(updates.startTime);
                const end = start + treatment.duration;
                updates.endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
                updates.price = treatment.price;
            }
        }
        const appointment = await Appointment.findOneAndUpdate(filter, updates, {
            new: true,
            runValidators: true,
        }).populate(["customer", "service", "staff", "salon"]);
        if (!appointment)
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        res.json({ success: true, data: appointment });
    } catch (e) {
        next(e);
    }
}

export async function updateAppointmentStatus(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const { status } = req.body;
        if (!["Pending", "Confirmed", "Completed", "Cancelled"].includes(status))
            return res.status(422).json({ success: false, message: "Invalid status" });
        const appointment = await Appointment.findOneAndUpdate(
            filter,
            { status },
            { new: true },
        ).populate(["customer", "service", "staff", "salon"]);
        if (!appointment)
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        res.json({ success: true, data: appointment });
    } catch (e) {
        next(e);
    }
}

export async function deleteAppointment(req, res, next) {
    try {
        const filter = { _id: req.params.id };
        if (["manager", "owner"].includes(req.user.role)) filter.salon = req.user.salonId;
        const appointment = await Appointment.findOneAndDelete(filter);
        if (!appointment)
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        res.json({ success: true, data: appointment });
    } catch (e) {
        next(e);
    }
}
