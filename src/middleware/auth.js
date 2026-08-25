import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function protect(req, res, next) {
    try {
        const token = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;
        if (!token)
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user || req.user.status !== "active")
            return res
                .status(401)
                .json({ success: false, message: "Account unavailable" });
        next();
    } catch {
        res
            .status(401)
            .json({ success: false, message: "Invalid or expired session" });
    }
}
export const authorize =
    (...roles) =>
        (req, res, next) =>
            roles.includes(req.user.role)
                ? next()
                : res.status(403).json({ success: false, message: "Access denied" });
