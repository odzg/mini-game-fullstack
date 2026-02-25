import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { RPCHandler } from '@orpc/server/node';
import { z } from 'zod';

import { env } from './lib/env.ts';
import { prisma } from './lib/prisma.ts';
import { rpcRouter } from './lib/rpc.ts';
import {
  createOAuthState,
  createSessionToken,
  type SessionUser,
  verifySessionToken,
} from './lib/session.ts';

interface CookieOptions {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'Lax' | 'None' | 'Strict';
  secure?: boolean;
}

const googleTokenSchema = z.object({
  id_token: z.string(),
});

const googleTokenInfoSchema = z.object({
  aud: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  sub: z.string(),
});

const rpcHandler = new RPCHandler(rpcRouter);
const isSecureCookie = env.NODE_ENV === 'production';

function parseCookies(header: string | undefined): Record<string, string> {
  if (header === undefined || header.trim() === '') {
    return {};
  }

  return Object.fromEntries(
    header.split(';').flatMap((segment) => {
      const separatorIndex = segment.indexOf('=');

      if (separatorIndex <= 0) {
        return [];
      }

      const key = segment.slice(0, separatorIndex).trim();
      const value = segment.slice(separatorIndex + 1).trim();

      return [[key, decodeURIComponent(value)]];
    }),
  );
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  segments.push(`Path=${options.path ?? '/'}`);

  if (options.httpOnly === true) {
    segments.push('HttpOnly');
  }

  segments.push(`SameSite=${options.sameSite ?? 'Lax'}`);

  if (options.secure === true) {
    segments.push('Secure');
  }

  return segments.join('; ');
}

function appendSetCookie(
  response: ServerResponse<IncomingMessage>,
  cookie: string,
): void {
  const headerValue = response.getHeader('Set-Cookie');

  if (headerValue === undefined) {
    response.setHeader('Set-Cookie', [cookie]);
    return;
  }

  if (Array.isArray(headerValue)) {
    response.setHeader('Set-Cookie', [...headerValue, cookie]);
    return;
  }

  response.setHeader('Set-Cookie', [headerValue.toString(), cookie]);
}

function applyCors(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
): void {
  const requestOrigin = request.headers.origin;

  if (requestOrigin !== env.FRONTEND_ORIGIN) {
    return;
  }

  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Origin', requestOrigin);
  response.setHeader('Vary', 'Origin');
}

function writeJson(
  response: ServerResponse<IncomingMessage>,
  statusCode: number,
  payload: unknown,
): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function redirect(
  response: ServerResponse<IncomingMessage>,
  location: string,
): void {
  response.statusCode = 302;
  response.setHeader('Location', location);
  response.end();
}

function getSessionUser(
  request: IncomingMessage,
): SessionUser | null {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[env.SESSION_COOKIE_NAME];

  return verifySessionToken(token, env.SESSION_SECRET);
}

async function fetchGoogleProfile(code: string) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange authorization code with Google');
  }

  const tokenPayload = googleTokenSchema.parse(await tokenResponse.json());
  const tokenInfoUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
  tokenInfoUrl.searchParams.set('id_token', tokenPayload.id_token);

  const tokenInfoResponse = await fetch(tokenInfoUrl);

  if (!tokenInfoResponse.ok) {
    throw new Error('Failed to validate Google ID token');
  }

  const tokenInfo = googleTokenInfoSchema.parse(await tokenInfoResponse.json());

  if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience mismatch');
  }

  return tokenInfo;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', env.APP_ORIGIN);
    const requestMethod = request.method ?? 'GET';

    if (requestMethod === 'OPTIONS') {
      applyCors(request, response);
      response.statusCode = 204;
      response.end();
      return;
    }

    if (url.pathname.startsWith('/rpc')) {
      applyCors(request, response);

      const handleResult = await rpcHandler.handle(request, response, {
        context: { user: getSessionUser(request) },
        prefix: '/rpc',
      });

      if (handleResult.matched) {
        return;
      }
    }

    if (requestMethod === 'GET' && url.pathname === '/health') {
      writeJson(response, 200, { status: 'ok' });
      return;
    }

    if (requestMethod === 'GET' && url.pathname === '/auth/google/start') {
      const state = createOAuthState();
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('prompt', 'consent');

      appendSetCookie(
        response,
        serializeCookie('oauth_state', state, {
          httpOnly: true,
          maxAge: 300,
          path: '/',
          sameSite: 'Lax',
          secure: isSecureCookie,
        }),
      );
      redirect(response, authUrl.toString());
      return;
    }

    if (requestMethod === 'GET' && url.pathname === '/auth/google/callback') {
      const authorizationCode = url.searchParams.get('code');
      const callbackState = url.searchParams.get('state');
      const cookies = parseCookies(request.headers.cookie);

      appendSetCookie(
        response,
        serializeCookie('oauth_state', '', {
          httpOnly: true,
          maxAge: 0,
          path: '/',
          sameSite: 'Lax',
          secure: isSecureCookie,
        }),
      );

      if (
        authorizationCode === null ||
        callbackState === null ||
        cookies.oauth_state !== callbackState
      ) {
        redirect(response, `${env.FRONTEND_ORIGIN}/?error=oauth_state`);
        return;
      }

      try {
        const googleProfile = await fetchGoogleProfile(authorizationCode);
        const user = await prisma.user.upsert({
          create: {
            email: googleProfile.email ?? null,
            googleSub: googleProfile.sub,
            name: googleProfile.name ?? null,
            picture: googleProfile.picture ?? null,
          },
          update: {
            email: googleProfile.email ?? null,
            name: googleProfile.name ?? null,
            picture: googleProfile.picture ?? null,
          },
          where: {
            googleSub: googleProfile.sub,
          },
        });

        const sessionToken = createSessionToken(
          {
            email: user.email,
            id: user.id,
            name: user.name,
            picture: user.picture,
          },
          env.SESSION_SECRET,
          env.SESSION_TTL_SECONDS,
        );

        appendSetCookie(
          response,
          serializeCookie(env.SESSION_COOKIE_NAME, sessionToken, {
            httpOnly: true,
            maxAge: env.SESSION_TTL_SECONDS,
            path: '/',
            sameSite: 'Lax',
            secure: isSecureCookie,
          }),
        );
        redirect(response, `${env.FRONTEND_ORIGIN}/game`);
      } catch {
        redirect(response, `${env.FRONTEND_ORIGIN}/?error=oauth_failed`);
      }
      return;
    }

    if (requestMethod === 'GET' && url.pathname === '/auth/me') {
      applyCors(request, response);

      const user = getSessionUser(request);

      if (user === null) {
        writeJson(response, 401, { user: null });
        return;
      }

      writeJson(response, 200, { user });
      return;
    }

    if (requestMethod === 'POST' && url.pathname === '/auth/logout') {
      applyCors(request, response);

      appendSetCookie(
        response,
        serializeCookie(env.SESSION_COOKIE_NAME, '', {
          httpOnly: true,
          maxAge: 0,
          path: '/',
          sameSite: 'Lax',
          secure: isSecureCookie,
        }),
      );
      writeJson(response, 200, { ok: true });
      return;
    }

    writeJson(response, 404, { error: 'Not Found' });
  } catch (error) {
    console.error(error);
    writeJson(response, 500, { error: 'Internal Server Error' });
  }
});

server.listen(env.API_PORT);

const shutdown = () => {
  void prisma.$disconnect().finally(() => {
    server.close();
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
