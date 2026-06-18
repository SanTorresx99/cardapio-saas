import { z } from 'zod';
import { jsonResponse } from '@/lib/middleware';
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

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return jsonResponse({ success: false, error: firstError.message }, 400);
  }

  const { name, email, restaurantName, phone } = parsed.data;

  // TODO: verificar e-mail duplicado no D1
  // TODO: salvar tenant e usuário no D1 com senha em bcrypt hash

  const tenantSlug = slugify(restaurantName);
  const tenantId = `tenant_${Date.now()}`;
  const userId = `usr_${Date.now()}`;

  return jsonResponse({
    success: true,
    message: 'Restaurante cadastrado com sucesso',
    data: {
      userId,
      tenantId,
      tenantSlug,
      name,
      email,
      restaurantName,
      phone,
    },
  }, 201);
};
