import { z } from 'zod';
import { jsonResponse } from '@/lib/middleware';
import { hashPassword, signJWT } from '@/lib/auth';
import type { PagesFunction, Env } from '@/types/cloudflare';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(2),
  phone: z.string().min(8),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { name, email, password, restaurantName, phone } = parsed.data;

  const existing = await env.DB.prepare(
    'SELECT id FROM tenants WHERE email_admin = ?'
  ).bind(email).first();

  if (existing) {
    return jsonResponse({ success: false, error: 'E-mail já cadastrado' }, 409);
  }

  let slug = slugify(restaurantName);
  const slugConflict = await env.DB.prepare(
    'SELECT id FROM tenants WHERE slug = ?'
  ).bind(slug).first();
  if (slugConflict) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const senhaHash = await hashPassword(password);

  const result = await env.DB.prepare(
    `INSERT INTO tenants (nome, slug, email_admin, senha_hash, telefone_admin, whatsapp_numero, plano, status)
     VALUES (?, ?, ?, ?, ?, ?, 'free', 'ativo')`
  ).bind(restaurantName, slug, email, senhaHash, phone, phone).run();

  const tenantId = result.meta.last_row_id;

  const token = await signJWT(
    { sub: String(tenantId), email, name: restaurantName, role: 'restaurant', tenantId: String(tenantId), tenantSlug: slug },
    env.JWT_SECRET
  );

  return jsonResponse({
    success: true,
    message: 'Restaurante cadastrado com sucesso',
    token,
    user: { id: String(tenantId), email, name, restaurantName, tenantSlug: slug, role: 'restaurant' },
  }, 201);
};
