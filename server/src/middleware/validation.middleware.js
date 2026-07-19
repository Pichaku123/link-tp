import { ZodError } from "zod";

//reused from previous project(clipcode)
export const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const formattedErrors = err.errors.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                }));
                return res.status(400).json({ error: "Validation failed.", details: formattedErrors });
            }
            next(err);
        }
    };
};
