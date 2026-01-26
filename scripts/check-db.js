
const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient({ log: ['info'], datasources: { db: { url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/perpetuo' } } });

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to database');
        process.exit(0);
    } catch (e) {
        console.error('Failed to connect to database:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
