import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '@/types/auth';

const encodeSecret = (secret: string) => new TextEncoder().encode(secret);

export async function signJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>, secret: string): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodeSecret(secret));
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret));
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = hex.match(/.{2}/g)!.map(b => parseInt(b, 16));
  const buf = new ArrayBuffer(bytes.length);
  new Uint8Array(buf).set(bytes);
  return buf;
}

async function pbkdf2Derive(password: string, saltBuffer: ArrayBuffer): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBuffer, iterations: 100_000 },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<string> {
  const saltBuffer = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(saltBuffer));
  const salt = Array.from(new Uint8Array(saltBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = await pbkdf2Derive(password, saltBuffer);
  return `pbkdf2:${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, expectedHash] = parts;
    const computed = await pbkdf2Derive(password, hexToBuffer(saltHex));
    return computed === expectedHash;
  }
  // Compatibilidade com hashes SHA-256 antigos (migração automática no próximo login)
  if (stored.startsWith('sha256:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, expectedHash] = parts;
    const data = new TextEncoder().encode(`${saltHex}:${password}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const computed = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === expectedHash;
  }
  return false;
}

export function decodeTokenClient(token: string): JWTPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
