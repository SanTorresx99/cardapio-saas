import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

// JWT é stateless — logout é gerenciado no cliente removendo o token.
// Este endpoint existe para consistência e futura blacklist de tokens no D1.
export const onRequestPost: PagesFunction<Env> = async () => {
  return jsonResponse({ success: true, message: 'Logout realizado' });
};
