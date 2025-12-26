import type { FastifyRequest, FastifyReply } from 'fastify';
import { lucia } from '../auth/lucia.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const sessionId = request.cookies[lucia.sessionCookieName];

  if (!sessionId) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);

    if (!session) {
      return reply.status(401).send({ error: 'Invalid session' });
    }

    // Attach user to request
    (request as any).user = user;
    (request as any).session = session;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}
