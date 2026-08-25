import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));
app.get("/api/health", (req, res) =>
    res.json({ success: true, message: "Salon API is running" }),
);
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
export default app;
