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

export function decodeTokenClient(token: string): JWTPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
