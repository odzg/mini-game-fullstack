const DEFAULT_API_PORT = 4000;
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';
const DEFAULT_SESSION_COOKIE_NAME = 'mini_game_session';
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, fallback: string): string {
  const value = process.env[name];

  return value === undefined || value.trim() === '' ? fallback : value;
}

function getOptionalNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number in environment variable: ${name}`);
  }

  return parsed;
}

const apiPort = getOptionalNumberEnv('API_PORT', DEFAULT_API_PORT);
const appOrigin = getOptionalEnv('APP_ORIGIN', `http://localhost:${apiPort}`);

export const env = {
  APP_ORIGIN: appOrigin,
  API_PORT: apiPort,
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  FRONTEND_ORIGIN: getOptionalEnv('FRONTEND_ORIGIN', DEFAULT_FRONTEND_ORIGIN),
  GOOGLE_CLIENT_ID: getRequiredEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: getOptionalEnv(
    'GOOGLE_REDIRECT_URI',
    `${appOrigin}/auth/google/callback`,
  ),
  NODE_ENV: getOptionalEnv('NODE_ENV', 'development'),
  SESSION_COOKIE_NAME: getOptionalEnv(
    'SESSION_COOKIE_NAME',
    DEFAULT_SESSION_COOKIE_NAME,
  ),
  SESSION_SECRET: getRequiredEnv('SESSION_SECRET'),
  SESSION_TTL_SECONDS: getOptionalNumberEnv(
    'SESSION_TTL_SECONDS',
    DEFAULT_SESSION_TTL_SECONDS,
  ),
};
