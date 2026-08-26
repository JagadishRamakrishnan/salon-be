import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const tokenFor = (user) =>
    jwt.sign(
        { id: user._id, userId: user._id, role: user.role, salonId: user.salon || null },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
    );
const publicUser = (user) => ({
    id: user._id,
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    salon: user.salon,
    salonId: user.salon || null,
});
export async function register(req, res, next) {
    try {
        const { name, email, phone, password, role } = req.body;

        if (!name || !email || !password || password.length < 6) {
            return res.status(422).json({
                success: false,
                message: "Name, email and a 6+ character password are required",
            });
        }

        if (await User.findOne({ email })) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const user = await User.create({
            name,
            email,
            phone,
            password: await bcrypt.hash(password, 12),
            role: "customer",
        });

        res.status(201).json({
            success: true,
            token: tokenFor(user),
            user: publicUser(user),
        });
    } catch (error) {
        next(error);
    }
}
export async function login(req, res, next) {
    try {
        const user = await User.findOne({ email: req.body.email }).select(
            "+password",
        );
        if (
            !user ||
            !(await bcrypt.compare(req.body.password || "", user.password))
        )
            return res
                .status(401)
                .json({ success: false, message: "Email or password is incorrect" });
        res.json({
            success: true,
            token: tokenFor(user),
            user: publicUser(user),
        });
    } catch (error) {
        next(error);
    }
}
export function me(req, res) {
    res.json({ success: true, user: req.user });
}
