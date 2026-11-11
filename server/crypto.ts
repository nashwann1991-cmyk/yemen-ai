import crypto from 'crypto';

const MASTER_SECRET = process.env.JWT_SECRET || 'creative-ai-studio-pro-secret-pepper-2026-secure';
const ENCRYPTION_KEY = crypto.scryptSync(MASTER_SECRET, 'salt-salt-salt', 32);

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// Generate license key like: CS-A8F2-99CD-4421-E08B
export function generateActivationKeyString(): string {
  const parts = [];
  parts.push('CS');
  for (let i = 0; i < 4; i++) {
    parts.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return parts.join('-');
}

// Hash activation key with HMAC so the plaintext cannot be recovered from db
export function hashActivationKey(keyString: string): string {
  const clean = keyString.trim().toUpperCase();
  return crypto.createHmac('sha256', MASTER_SECRET).update(clean).digest('hex');
}

// AES-256-GCM symmetric encryption for Customer BYOK API keys
export function encryptCustomerApiKey(plaintextKey: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plaintextKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decryptCustomerApiKey(encryptedBlob: string): string | null {
  try {
    const [ivHex, tagHex, cipherHex] = encryptedBlob.split(':');
    if (!ivHex || !tagHex || !cipherHex) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// Simple signed token for sessions
export function signSessionToken(payload: { uid: string; email: string; role: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', MASTER_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { uid: string; email: string; role: string } | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expected = crypto.createHmac('sha256', MASTER_SECRET).update(data).digest('base64url');
    if (signature !== expected) return null;
    const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { uid: decoded.uid, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}
