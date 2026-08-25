export function notFound(req, res) {
    res
        .status(404)
        .json({ success: false, message: `Route ${req.originalUrl} not found` });
}
export function errorHandler(error, req, res, next) {
    console.error(error);
    const status = error.status || (error.name === "ValidationError" ? 422 : 500);
    res
        .status(status)
        .json({
            success: false,
            message: status === 500 ? "Something went wrong" : error.message,
        });
}
