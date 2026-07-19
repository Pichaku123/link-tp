const errorHandler = (err, req, res, next) => {
    console.error(err.stack || err);

    if (err.code === "P2025") {
        return res.status(404).json({ error: "Record not found." });
    }
    if (err.code === "P2002") {
        return res.status(409).json({ error: "Duplicate entry, a record with that value already exists." });
    }

    res.status(err.status || 500).json({
        error: err.message || "Internal server error.",
    });
};

export default errorHandler;
