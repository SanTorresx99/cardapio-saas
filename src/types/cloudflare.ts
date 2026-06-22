export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<{ results: T[]; success: boolean }[]>;
}

export interface Env {
  JWT_SECRET: string;
  ENVIRONMENT: string;
  DB: D1Database;
}

export interface PagesFunctionContext<E = Env> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

export type PagesFunction<E = Env> = (context: PagesFunctionContext<E>) => Response | Promise<Response>;
