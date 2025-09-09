'use strict';

const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

/**
 * Utility: hash a token using SHA-256. Only store and compare hashes.
 */
function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// PUBLIC_INTERFACE
/**
 * createApiToken
 * Creates a new API token for the current user.
 * - Generates a random token string (prefix 'lfp_' + hex) and stores only its hash.
 * - Validates optional scopes list.
 * - Supports optional expiresAt ISO string.
 * Returns: { token: <plain value to show once>, apiToken: <stored record sans tokenHash> }
 */
async function createApiToken(currentUserId, { name, scopes = [], expiresAt } = {}) {
  if (!currentUserId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  if (!name || typeof name !== 'string') {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }
  if (!Array.isArray(scopes)) {
    throw Object.assign(new Error('scopes must be an array'), { status: 400 });
  }

  // Basic scope validation: allow simple strings with namespace:action style, but keep open-ended for now
  for (const s of scopes) {
    if (typeof s !== 'string' || s.length > 128) {
      throw Object.assign(new Error('invalid scope entry'), { status: 400 });
    }
  }

  // Generate token and hash
  const random = crypto.randomBytes(24).toString('hex'); // 48 chars
  const token = `lfp_${random}`;
  const tokenHash = sha256(token);

  const data = {
    userId: currentUserId,
    name,
    tokenHash,
    scopes,
  };
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) {
      throw Object.assign(new Error('invalid expiresAt'), { status: 400 });
    }
    data.expiresAt = d;
  }

  const created = await prisma.apiToken.create({
    data,
  });

  // Return the token only once
  const { tokenHash: _omit, ...safe } = created;
  return { token, apiToken: safe };
}

// PUBLIC_INTERFACE
/**
 * listApiTokens
 * Lists API tokens for the current user.
 * Returns stored metadata (without tokenHash).
 */
async function listApiTokens(currentUserId) {
  if (!currentUserId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const rows = await prisma.apiToken.findMany({
    where: { userId: currentUserId },
    orderBy: { createdAt: 'desc' },
  });
  return {
    tokens: rows.map(({ tokenHash, ...rest }) => rest),
  };
}

// PUBLIC_INTERFACE
/**
 * revokeApiToken
 * Revokes (deletes) an API token by id. Only owner can revoke.
 */
async function revokeApiToken(currentUserId, tokenId) {
  if (!currentUserId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  if (!tokenId) {
    throw Object.assign(new Error('tokenId is required'), { status: 400 });
  }
  const token = await prisma.apiToken.findUnique({ where: { id: tokenId } });
  if (!token) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }
  if (token.userId !== currentUserId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  await prisma.apiToken.delete({ where: { id: tokenId } });
  return { revoked: true };
}

// PUBLIC_INTERFACE
/**
 * listWorkspaceAccess
 * Lists workspace members and roles (duplicate of permissions.getWorkspaceRoles),
 * provided here for Settings section convenience. Requires ADMIN+.
 */
async function listWorkspaceAccess(currentUserId, workspaceId) {
  return requireWorkspaceRole(currentUserId, workspaceId, 'ADMIN').then(async () => {
    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true, imageUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { members };
  });
}

module.exports = {
  createApiToken,
  listApiTokens,
  revokeApiToken,
  listWorkspaceAccess,
};
