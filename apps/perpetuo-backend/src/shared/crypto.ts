import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// API Key generation - format: pk_xxxxx
export function generateAPIKey(): string {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `pk_${randomPart}`;
}

// Simple key encryption for provider keys (in production, use AWS KMS)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-not-secure';

export function encryptKey(key: string): string {
  // For MVP: simple base64. In production, use proper encryption.
  return Buffer.from(key).toString('base64');
}

export function decryptKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// Timestamp utilities
export function now(): Date {
  return new Date();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
