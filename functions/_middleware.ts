import type { PagesFunction, Env } from '@/types/cloudflare';
import { corsPreflightResponse } from '@/lib/middleware';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  return context.next();
};
