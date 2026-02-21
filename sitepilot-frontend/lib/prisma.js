/**
 * Prisma Client Setup
 * 
 * Singleton pattern for Next.js to prevent multiple instances
 * during hot reloading in development.
 * 
 * This ensures we don't exhaust database connections.
 */

import { PrismaClient } from '@prisma/client'

/**
 * PrismaClient is attached to the `global` object in development
 * to prevent exhausting database connections due to hot reloading.
 */
const globalForPrisma = globalThis

/**
 * Initialize Prisma Client with production-ready settings
 */
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

/**
 * In development, store the instance globally to prevent
 * creating new instances on every hot reload
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Graceful shutdown
 * Disconnect from database when the process terminates
 */
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma
