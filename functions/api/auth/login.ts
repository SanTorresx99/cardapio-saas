import { z } from 'zod';
import { signJWT } from '@/lib/auth';
import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// TODO: substituir por consulta ao D1 quando banco for configurado
const DEV_USERS = [
  {
    id: 'usr_001',
    email: 'admin@cardapio.saas',
    passwordHash: 'admin123',
    name: 'Admin SaaS',
    role: 'admin' as const,
  },
  {
    id: 'usr_002',
    email: 'restaurante@teste.com',
    passwordHash: 'senha123',
    name: 'Restaurante Teste',
    role: 'restaurant' as const,
    tenantId: 'tenant_001',
  },
];

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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

  // TODO: buscar usuário do D1 e comparar hash bcrypt
  const user = DEV_USERS.find(u => u.email === email && u.passwordHash === password);
  if (!user) {
    return jsonResponse({ success: false, error: 'Credenciais inválidas' }, 401);
  }

  const token = await signJWT(
    { sub: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
    env.JWT_SECRET
  );

  return jsonResponse({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
  });
};
