import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface SessionUser {
  email: string | null;
  id: string;
  name: string | null;
  picture: string | null;
}

interface SessionPayload extends SessionUser {
  exp: number;
  iat: number;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePayload(value: unknown): SessionPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const email = value.email;
  const name = value.name;
  const picture = value.picture;
  const iat = value.iat;
  const exp = value.exp;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (email !== null && email !== undefined && typeof email !== 'string') {
    return null;
  }

  if (name !== null && name !== undefined && typeof name !== 'string') {
    return null;
  }

  if (picture !== null && picture !== undefined && typeof picture !== 'string') {
    return null;
  }

  if (typeof iat !== 'number' || Number.isNaN(iat)) {
    return null;
  }

  if (typeof exp !== 'number' || Number.isNaN(exp)) {
    return null;
  }

  return {
    email: email ?? null,
    exp,
    iat,
    id,
    name: name ?? null,
    picture: picture ?? null,
  };
}

export function createOAuthState(): string {
  return randomBytes(24).toString('base64url');
}

export function createSessionToken(
  user: SessionUser,
  secret: string,
  ttlSeconds: number,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    exp: issuedAt + ttlSeconds,
    iat: issuedAt,
  };
  const encodedHeader = encodeBase64Url(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  );
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
): SessionUser | null {
  if (token === undefined || token.trim() === '') {
    return null;
  }

  const [encodedHeader, encodedPayload, providedSignature] = token.split('.');

  if (
    encodedHeader === undefined ||
    encodedPayload === undefined ||
    providedSignature === undefined
  ) {
    return null;
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedBuffer = Buffer.from(providedSignature, 'utf8');

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  let decodedPayload: unknown;

  try {
    decodedPayload = JSON.parse(decodeBase64Url(encodedPayload));
  } catch {
    return null;
  }

  const payload = parsePayload(decodedPayload);

  if (payload === null) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    email: payload.email,
    id: payload.id,
    name: payload.name,
    picture: payload.picture,
  };
}
