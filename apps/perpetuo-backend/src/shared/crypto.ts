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

// Hash API key for secure storage (SHA256)
export function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Verify API key against hash
export function verifyAPIKey(key: string, hash: string): boolean {
  return hashAPIKey(key) === hash;
}

// AES-256-GCM encryption for provider keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required (must be 32 bytes base64 encoded)');
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'base64');
if (KEY_BUFFER.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 bytes when base64 decoded');
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptKey(key: string): string {
  // Generate random IV for this encryption
  const iv = crypto.randomBytes(12);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  
  // Encrypt
  let ciphertext = cipher.update(key, 'utf-8', 'hex');
  ciphertext += cipher.final('hex');
  
  // Get auth tag
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return combined as JSON and base64 encode
  const data: EncryptedData = {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
  };
  
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decryptKey(encrypted: string): string {
  // Decode from base64
  const data: EncryptedData = JSON.parse(
    Buffer.from(encrypted, 'base64').toString('utf-8')
  );
  
  // Recreate decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    KEY_BUFFER,
    Buffer.from(data.iv, 'hex')
  );
  
  // Set auth tag
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  
  // Decrypt
  let plaintext = decipher.update(data.ciphertext, 'hex', 'utf-8');
  plaintext += decipher.final('utf-8');
  
  return plaintext;
}

// Timestamp utilities
export function now(): Date {
  return new Date();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
