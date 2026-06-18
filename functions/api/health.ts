import type { PagesFunction, Env } from '@/types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return new Response(
    JSON.stringify({
      ok: true,
      ts: Date.now(),
      environment: env.ENVIRONMENT ?? 'unknown',
      jwtConfigured: !!env.JWT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
