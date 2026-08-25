import Category from "../models/Category.js";
import Service from "../models/Service.js";

export async function listCategories(req, res, next) {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) filter.name = new RegExp(search, "i");
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Category.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)),
            Category.countDocuments(filter),
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

export async function createCategory(req, res, next) {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (e) {
        next(e);
    }
}

export async function updateCategory(req, res, next) {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!category)
            return res.status(404).json({ success: false, message: "Category not found" });
        res.json({ success: true, data: category });
    } catch (e) {
        next(e);
    }
}

export async function deleteCategory(req, res, next) {
    try {
        const inUse = await Service.exists({ category: req.params.id });
        if (inUse)
            return res.status(409).json({
                success: false,
                message: "This category is used by existing services and cannot be deleted",
            });
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category)
            return res.status(404).json({ success: false, message: "Category not found" });
        res.json({ success: true, data: category });
    } catch (e) {
        next(e);
    }
}
