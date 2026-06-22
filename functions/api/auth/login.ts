import { z } from 'zod';
import { signJWT, verifyPassword, hashPassword } from '@/lib/auth';
import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface TenantRow {
  id: number;
  nome: string;
  slug: string;
  email_admin: string;
  senha_hash: string;
  plano: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.JWT_SECRET) {
      return jsonResponse({ success: false, error: 'Servidor não configurado: JWT_SECRET ausente' }, 500);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Body inválido' }, 400);
    }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ success: false, error: 'E-mail ou senha inválidos' }, 400);
    }

    const { email, password } = parsed.data;

    const tenant = await env.DB.prepare(
      `SELECT id, nome, slug, email_admin, senha_hash, plano
       FROM tenants WHERE email_admin = ? AND status = 'ativo'`
    ).bind(email).first<TenantRow>();

    if (!tenant) {
      return jsonResponse({ success: false, error: 'Credenciais inválidas' }, 401);
    }

    const valid = await verifyPassword(password, tenant.senha_hash);
    if (!valid) {
      return jsonResponse({ success: false, error: 'Credenciais inválidas' }, 401);
    }

    // Migra hash legado SHA-256 → PBKDF2 na primeira autenticação bem-sucedida
    if (tenant.senha_hash.startsWith('sha256:')) {
      const novoHash = await hashPassword(password);
      await env.DB.prepare('UPDATE tenants SET senha_hash = ? WHERE id = ?')
        .bind(novoHash, tenant.id).run();
    }

    const token = await signJWT(
      {
        sub: String(tenant.id),
        email: tenant.email_admin,
        name: tenant.nome,
        role: 'restaurant',
        tenantId: String(tenant.id),
        tenantSlug: tenant.slug,
      },
      env.JWT_SECRET
    );

    return jsonResponse({
      success: true,
      token,
      user: {
        id: String(tenant.id),
        email: tenant.email_admin,
        name: tenant.nome,
        role: 'restaurant',
        tenantId: String(tenant.id),
        tenantSlug: tenant.slug,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return jsonResponse({ success: false, error: `Erro interno: ${message}` }, 500);
  }
};
