import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/client.js";

let globalAdapter: PrismaMariaDb | null = null;
let globalInstance: PrismaClient | null = null;

export async function getPrismaClient(): Promise<PrismaClient> {
    // Validasi password dihapus biar support empty string (Laragon)
    if (!process.env['DATABASE_HOST'] ||
        !process.env['DATABASE_PORT'] ||
        !process.env['DATABASE_USER'] ||
        !process.env['DATABASE_NAME']) {
        throw new Error("Database environment variables are not set.");
    }

    const port = parseInt(process.env['DATABASE_PORT'], 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
        throw new Error("Invalid database port number.");
    }

    if (!globalAdapter) {
        globalAdapter = new PrismaMariaDb({
            host: process.env['DATABASE_HOST'],
            port,
            user: process.env['DATABASE_USER'],
            password: process.env['DATABASE_PASSWORD'] || "", 
            database: process.env['DATABASE_NAME'],
            connectionLimit: 5,
            connectTimeout: 2000,
            initializationTimeout: 5000,
            acquireTimeout: 2000,
            allowPublicKeyRetrieval: true,
        });
    }

    if (!globalInstance) {
        globalInstance = new PrismaClient({ adapter: globalAdapter });

        try {
            await globalInstance.$executeRaw`SELECT 1`;
        }
        catch (error) {
            console.error("Failed to connect to the database:", error);
            process.exit(1);
        }

        console.log("Database connected successfully.");
    }

    return globalInstance;
}