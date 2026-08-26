import Salon from "../models/Salon.js";
import Staff from "../models/Staff.js";

const scoped = (req, id) => ["manager", "owner"].includes(req.user.role) ? req.user.salonId : id;
const staffFilter = (req, id) => ({ _id: id, ...(["manager", "owner"].includes(req.user.role) ? { salon: req.user.salonId } : {}) });
const validHours = (hours) => Array.isArray(hours) && hours.every((item) => item.closed || (item.open && item.close && item.open < item.close));

export async function getSalonHours(req, res, next) {
    try {
        const salon = await Salon.findById(scoped(req, req.params.id), "name workingHours");
        if (!salon) return res.status(404).json({ success: false, message: "Salon not found" });
        res.json({ success: true, data: salon });
    } catch (error) { next(error); }
}

export async function updateSalonHours(req, res, next) {
    try {
        const workingHours = req.body.workingHours;
        if (!validHours(workingHours) || workingHours.length !== 7)
            return res.status(422).json({ success: false, message: "Provide valid hours for all seven days" });
        const salon = await Salon.findByIdAndUpdate(scoped(req, req.params.id), { workingHours }, { new: true, runValidators: true });
        if (!salon) return res.status(404).json({ success: false, message: "Salon not found" });
        res.json({ success: true, data: salon });
    } catch (error) { next(error); }
}

export async function getStaffHours(req, res, next) {
    try {
        const staff = await Staff.findOne(staffFilter(req, req.params.id), "name workingHours salon");
        if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (error) { next(error); }
}

export async function updateStaffHours(req, res, next) {
    try {
        if (!validHours(req.body.workingHours) || req.body.workingHours.length !== 7)
            return res.status(422).json({ success: false, message: "Provide valid hours for all seven days" });
        const staff = await Staff.findOneAndUpdate(staffFilter(req, req.params.id), { workingHours: req.body.workingHours }, { new: true, runValidators: true });
        if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff });
    } catch (error) { next(error); }
}

export async function listStaffLeaves(req, res, next) {
    try {
        const staff = await Staff.findOne(staffFilter(req, req.params.id), "name leaves salon");
        if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
        res.json({ success: true, data: staff.leaves || [] });
    } catch (error) { next(error); }
}

export async function addStaffLeave(req, res, next) {
    try {
        const { startDate, endDate, startTime, endTime, reason, status = "active" } = req.body;
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate) || startTime && endTime && startTime >= endTime)
            return res.status(422).json({ success: false, message: "Leave dates and times are invalid" });
        const staff = await Staff.findOne(staffFilter(req, req.params.id));
        if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
        staff.leaves.push({ startDate, endDate, startTime, endTime, reason, status });
        await staff.save();
        res.status(201).json({ success: true, data: staff.leaves.at(-1) });
    } catch (error) { next(error); }
}

export async function updateStaffLeave(req, res, next) {
    try {
        const staff = await Staff.findOne(staffFilter(req, req.params.id));
        const leave = staff?.leaves.id(req.params.leaveId);
        if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
        Object.assign(leave, req.body);
        if (new Date(leave.startDate) > new Date(leave.endDate) || leave.startTime && leave.endTime && leave.startTime >= leave.endTime)
            return res.status(422).json({ success: false, message: "Leave dates and times are invalid" });
        await staff.save(); res.json({ success: true, data: leave });
    } catch (error) { next(error); }
}

export async function deleteStaffLeave(req, res, next) {
    try {
        const staff = await Staff.findOne(staffFilter(req, req.params.id));
        if (!staff?.leaves.id(req.params.leaveId)) return res.status(404).json({ success: false, message: "Leave not found" });
        staff.leaves.pull(req.params.leaveId); await staff.save(); res.json({ success: true, data: staff.leaves });
    } catch (error) { next(error); }
}
