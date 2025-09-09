'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 30; // 30 days

/**
 * Helper: calculate expiration date from seconds in the future
 */
function secondsFromNow(seconds) {
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Helper: calculate expiration date from days in the future
 */
function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Hash a refresh token before saving to DB
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create signed JWT access token
 */
function signAccessToken(user) {
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    issuer: 'ledgerflow-backend',
    audience: 'ledgerflow-clients',
  });
  return token;
}

/**
 * Create opaque refresh token (random) and its hashed version
 */
function createRefreshTokenPair() {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshTokenHash = hashToken(refreshToken);
  return { refreshToken, refreshTokenHash };
}

/**
 * Persist a session with refresh token for a user
 */
async function createSessionForUser(userId, { userAgent, ipAddress }) {
  const { refreshToken, refreshTokenHash } = createRefreshTokenPair();
  const sessionToken = crypto.randomBytes(24).toString('hex');

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      // access token TTL does not gate session; session is for refresh,
      // we set longer expiry for refresh window:
      expiresAt: daysFromNow(REFRESH_TOKEN_TTL_DAYS),
    },
  });

  return { session, refreshToken };
}

/**
 * Invalidate a session by ID or token (soft revoke)
 */
async function revokeSession(where) {
  return prisma.session.updateMany({
    where: {
      ...where,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

// PUBLIC_INTERFACE
/**
 * signup
 * Registers a new user using email and password.
 * - Hashes password using bcrypt
 * - Creates a session with refresh token
 * - Returns accessToken, refreshToken and user profile
 * Params:
 *  - email: string
 *  - password: string
 *  - name?: string
 *  - context: { userAgent?: string, ipAddress?: string }
 * Returns:
 *  { user, accessToken, refreshToken }
 */
async function signup({ email, password, name }, context = {}) {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
    },
  });

  const accessToken = signAccessToken(user);
  const { refreshToken, session } = await createSessionForUser(user.id, context);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

// PUBLIC_INTERFACE
/**
 * login
 * Authenticates user by email/password and issues tokens.
 * Params:
 *  - email: string
 *  - password: string
 *  - context: { userAgent?: string, ipAddress?: string }
 * Returns:
 *  { user, accessToken, refreshToken }
 */
async function login({ email, password }, context = {}) {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required'), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const accessToken = signAccessToken(user);
  const { refreshToken, session } = await createSessionForUser(user.id, context);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

// PUBLIC_INTERFACE
/**
 * me
 * Resolve current user from JWT payload (req.user populated by auth middleware)
 * Params:
 *  - userId: string
 * Returns:
 *  { user }
 */
async function me(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, imageUrl: true, createdAt: true, updatedAt: true,
    },
  });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return { user };
}

// PUBLIC_INTERFACE
/**
 * refresh
 * Validates a provided refreshToken against stored session hash.
 * If valid and not revoked/expired, returns new access + new refresh token and rotates the stored hash.
 * Params:
 *  - sessionToken?: string (optional)
 *  - refreshToken: string (required)
 *  - context: { userAgent?: string, ipAddress?: string }
 * Returns:
 *  { accessToken, refreshToken, user }
 */
async function refresh({ sessionToken, refreshToken }, context = {}) {
  if (!refreshToken) {
    throw Object.assign(new Error('refreshToken is required'), { status: 400 });
  }
  const refreshHash = hashToken(refreshToken);

  // Either by specific sessionToken or by any active session having this refresh hash
  const session = await prisma.session.findFirst({
    where: {
      ...(sessionToken ? { sessionToken } : {}),
      refreshTokenHash: refreshHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session || !session.user) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  // Rotate refresh token
  const { refreshToken: newRefresh, refreshTokenHash: newRefreshHash } = createRefreshTokenPair();

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshHash,
      // Optional: extend session expiry window on activity
      expiresAt: daysFromNow(REFRESH_TOKEN_TTL_DAYS),
      userAgent: context.userAgent || session.userAgent,
      ipAddress: context.ipAddress || session.ipAddress,
    },
  });

  const accessToken = signAccessToken(session.user);

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      imageUrl: session.user.imageUrl,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    },
    accessToken,
    refreshToken: newRefresh,
    sessionId: session.id,
  };
}

// PUBLIC_INTERFACE
/**
 * logout
 * Revokes the active session by sessionToken or refreshToken.
 * Params:
 *  - sessionToken?: string
 *  - refreshToken?: string
 * Returns:
 *  { success: true }
 */
async function logout({ sessionToken, refreshToken }) {
  if (!sessionToken && !refreshToken) {
    throw Object.assign(new Error('sessionToken or refreshToken required'), { status: 400 });
  }

  let where = {};
  if (sessionToken) {
    where.sessionToken = sessionToken;
  } else if (refreshToken) {
    where.refreshTokenHash = hashToken(refreshToken);
  }

  await revokeSession(where);
  return { success: true };
}

module.exports = {
  signup,
  login,
  me,
  refresh,
  logout,
};
