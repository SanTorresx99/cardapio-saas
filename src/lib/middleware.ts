import { verifyJWT, getTokenFromRequest } from './auth';
import type { JWTPayload } from '@/types/auth';

export interface Env {
  JWT_SECRET: string;
  ENVIRONMENT: string;
  DB?: unknown; // D1Database — tipado quando @cloudflare/workers-types for instalado
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function requireAuth(
  request: Request,
  env: Env
): Promise<JWTPayload | Response> {
  const token = getTokenFromRequest(request);
  if (!token) return jsonResponse({ error: 'Não autorizado' }, 401);

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: 'Token inválido ou expirado' }, 401);

  return payload;
}
