import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import Salon from "../models/Salon.js";

export async function listReviews(req, res, next) {
    try {
        const filter = req.user.role === "admin" ? {} : { salon: req.user.salonId };
        const reviews = await Review.find(filter).populate("customer", "name").populate("salon", "name").sort("-createdAt");
        res.json({ success: true, data: reviews });
    } catch (error) { next(error); }
}

export async function createReview(req, res, next) {
    try {
        const { appointment, rating, comment } = req.body;
        if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
            return res.status(422).json({ success: false, message: "Rating must be a whole number from 1 to 5" });
        const booking = await Appointment.findOne({ _id: appointment, customer: req.user._id, status: "Completed" });
        if (!booking) return res.status(403).json({ success: false, message: "Only completed appointments can be reviewed" });
        if (await Review.exists({ appointment })) return res.status(409).json({ success: false, message: "This appointment has already been reviewed" });
        const review = await Review.create({ customer: req.user._id, salon: booking.salon, staff: booking.staff, appointment, rating: Number(rating), comment });
        const aggregate = await Review.aggregate([{ $match: { salon: booking.salon, status: "published" } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
        await Salon.findByIdAndUpdate(booking.salon, { rating: aggregate[0]?.average || 0, reviewCount: aggregate[0]?.count || 0 });
        res.status(201).json({ success: true, data: await review.populate(["salon", "staff"]) });
    } catch (error) { next(error); }
}

export async function moderateReview(req, res, next) {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });
        res.json({ success: true, data: review });
    } catch (error) { next(error); }
}

export async function deleteReview(req, res, next) {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });
        const aggregate = await Review.aggregate([{ $match: { salon: review.salon, status: "published" } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
        await Salon.findByIdAndUpdate(review.salon, { rating: aggregate[0]?.average || 0, reviewCount: aggregate[0]?.count || 0 });
        res.json({ success: true, data: review });
    } catch (error) { next(error); }
}
