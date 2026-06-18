export interface Env {
  JWT_SECRET: string;
  ENVIRONMENT: string;
  DB?: unknown; // D1Database — será tipado quando @cloudflare/workers-types for instalado
}

export interface PagesFunctionContext<E = Env> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

export type PagesFunction<E = Env> = (context: PagesFunctionContext<E>) => Response | Promise<Response>;
