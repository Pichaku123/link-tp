import app from "./server.js";
import prisma from "./prisma.js";

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await prisma.$connect();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start database connection:", err);
        process.exit(1);
    }
}

start();
