import { z } from "zod";

export const shortenSchema = z.object({
    longUrl: z
        .string({ required_error: "Long URL is required." })
        .url({ message: "Invalid URL format." }),
    customAlias: z
        .string()
        .min(3, { message: "Custom alias must be at least 3 characters long." })
        .max(30, { message: "Custom alias cannot exceed 30 characters." })
        .regex(/^[a-zA-Z0-9_-]+$/, { message: "Custom alias can only contain alphanumeric characters, underscores, and hyphens." })
        .optional(),
    expiresAt: z
        .string()
        .datetime({ message: "Invalid expiration date format." })
        .optional()
        .transform((val) => val ? new Date(val) : undefined)
});
