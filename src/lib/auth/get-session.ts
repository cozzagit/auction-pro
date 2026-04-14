import { auth } from './index';

export class AuthError extends Error {
  constructor(message = 'Non autenticato') {
    super(message);
    this.name = 'AuthError';
  }
}

export interface SessionData {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export async function getRequiredSession(): Promise<SessionData> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  return {
    userId: session.user.id,
    role: (session.user as { role: string }).role || 'customer',
    name: session.user.name || '',
    email: session.user.email || '',
  };
}

export function requireRole(session: SessionData, ...roles: string[]) {
  if (!roles.includes(session.role)) {
    throw new AuthError('Accesso non autorizzato');
  }
}

export function unauthorizedResponse() {
  return Response.json(
    { error: { code: 'UNAUTHORIZED', message: 'Non autenticato' } },
    { status: 401 },
  );
}

export function forbiddenResponse() {
  return Response.json(
    { error: { code: 'FORBIDDEN', message: 'Accesso non autorizzato' } },
    { status: 403 },
  );
}
