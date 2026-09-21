module.exports = {
  port: process.env.PORT || 3000,

  jwt: {
    // In a real deployment this MUST come from a secret manager / env var.
    accessSecret: process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret-change-me',
    accessTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 15 * 60), // 15 min
    refreshTtlMs: Number(process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000), // 7 days
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  },

  loginThrottle: {
    maxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
    windowMs: Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000), // 15 min
  },

  refreshCookie: {
    name: 'refresh_token',
    path: '/api/auth',
  },

  seedAdmin: {
    name: 'Root Administrator',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@accesscontrol.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  },
};
