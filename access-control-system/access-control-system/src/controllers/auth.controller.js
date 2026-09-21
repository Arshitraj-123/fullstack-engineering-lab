const bcrypt = require('bcryptjs');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../utils/tokens');
const { validateRegisterPayload, validateLoginPayload } = require('../utils/validators');
const usersStore = require('../data/usersStore');
const refreshTokenStore = require('../data/refreshTokenStore');
const loginAttemptStore = require('../data/loginAttemptStore');

function setRefreshCookie(res, token) {
  res.cookie(config.refreshCookie.name, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: config.refreshCookie.path,
    maxAge: config.jwt.refreshTtlMs,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(config.refreshCookie.name, { path: config.refreshCookie.path });
}

function register(req, res) {
  validateRegisterPayload(req.body);
  const { name, email, password } = req.body;

  if (usersStore.findByEmail(email)) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Role is deliberately never taken from the request body — letting a
  // client self-assign a role is a classic privilege-escalation bug.
  const passwordHash = bcrypt.hashSync(password, config.bcrypt.saltRounds);
  const user = usersStore.create({ name: name.trim(), email, passwordHash, role: 'user' });

  const accessToken = signAccessToken(user);
  const refreshToken = refreshTokenStore.issue(user.id);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    data: { user: usersStore.toPublic(user), accessToken },
  });
}

function login(req, res) {
  validateLoginPayload(req.body);
  const { email, password } = req.body;

  if (loginAttemptStore.isLockedOut(email)) {
    throw ApiError.tooManyRequests(
      'Too many failed login attempts. Try again in a few minutes.'
    );
  }

  const user = usersStore.findByEmail(email);
  const passwordMatches = user && bcrypt.compareSync(password, user.passwordHash);

  if (!passwordMatches) {
    loginAttemptStore.recordFailure(email);
    throw ApiError.unauthorized('Invalid email or password');
  }

  loginAttemptStore.clear(email);

  const accessToken = signAccessToken(user);
  const refreshToken = refreshTokenStore.issue(user.id);
  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    data: { user: usersStore.toPublic(user), accessToken },
  });
}

function refresh(req, res) {
  const token = req.cookies[config.refreshCookie.name];
  if (!token) {
    throw ApiError.unauthorized('No refresh token supplied');
  }

  const rotated = refreshTokenStore.rotate(token);
  if (!rotated) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  const record = refreshTokenStore.verify(rotated);
  const user = usersStore.findById(record.userId);
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists');
  }

  setRefreshCookie(res, rotated);
  const accessToken = signAccessToken(user);
  res.status(200).json({ data: { user: usersStore.toPublic(user), accessToken } });
}

function logout(req, res) {
  const token = req.cookies[config.refreshCookie.name];
  if (token) {
    refreshTokenStore.revoke(token);
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

function me(req, res) {
  const user = usersStore.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('Account no longer exists');
  }
  res.status(200).json({ data: usersStore.toPublic(user) });
}

module.exports = { register, login, refresh, logout, me };
