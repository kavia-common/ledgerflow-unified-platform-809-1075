'use strict';

const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

const ROLE_ORDER = {
  OWNER: 5,
  ADMIN: 4,
  MAINTAINER: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

// PUBLIC_INTERFACE
/**
 * getWorkspaceRoles
 * Returns all members and their roles for a workspace. Requires ADMIN+.
 */
async function getWorkspaceRoles(currentUserId, workspaceId) {
  await requireWorkspaceRole(currentUserId, workspaceId, 'ADMIN');
  const members = await prisma.membership.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, email: true, name: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return { members };
}

// PUBLIC_INTERFACE
/**
 * setWorkspaceRole
 * Update a member's role in a workspace. Requires OWNER or ADMIN if not demoting OWNER.
 * Only OWNER can change another OWNER or assign OWNER.
 */
async function setWorkspaceRole(currentUserId, workspaceId, { userId, role }) {
  if (!userId || !role) {
    throw Object.assign(new Error('userId and role are required'), { status: 400 });
  }
  if (!ROLE_ORDER[role]) {
    throw Object.assign(new Error('invalid role'), { status: 400 });
  }

  const acting = await requireWorkspaceRole(currentUserId, workspaceId, 'ADMIN');

  // Enforce sensitive OWNER transitions
  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target) {
    throw Object.assign(new Error('Target membership not found'), { status: 404 });
  }

  // Only OWNER can assign OWNER or demote OWNER
  if (role === 'OWNER' || target.role === 'OWNER') {
    if (acting.role !== 'OWNER') {
      throw Object.assign(new Error('Forbidden: only OWNER can change OWNER roles'), { status: 403 });
    }
  }

  const updated = await prisma.membership.update({
    where: { userId_workspaceId: { userId, workspaceId } },
    data: { role },
  });

  return { membership: updated };
}

// PUBLIC_INTERFACE
/**
 * getProjectPermissions
 * List project-level permissions for users within a workspace/project.
 * Requires workspace ADMIN+ or project canAdmin permission.
 */
async function getProjectPermissions(currentUserId, workspaceId, projectId) {
  // Need at least ADMIN at workspace or user has project canAdmin
  // First, verify workspace membership at least VIEWER to ensure context exists
  await requireWorkspaceRole(currentUserId, workspaceId, 'VIEWER');

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true, workspaceId: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  // Check elevated rights: workspace ADMIN+ or project canAdmin
  let hasAdmin = false;
  try {
    const membership = await requireWorkspaceRole(currentUserId, workspaceId, 'ADMIN');
    hasAdmin = !!membership;
  } catch (e) {
    // Not ADMIN; check project canAdmin
    const perm = await prisma.permission.findUnique({
      where: { userId_projectId: { userId: currentUserId, projectId } },
      select: { canAdmin: true },
    });
    hasAdmin = !!perm?.canAdmin;
  }
  if (!hasAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const permissions = await prisma.permission.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, email: true, name: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return { permissions };
}

// PUBLIC_INTERFACE
/**
 * setProjectPermission
 * Upsert a user's permission flags on a project.
 * Requires workspace ADMIN+ or project canAdmin.
 * Body may include: canRead, canWrite, canExecute, canAdmin
 */
async function setProjectPermission(currentUserId, workspaceId, projectId, { userId, canRead, canWrite, canExecute, canAdmin }) {
  if (!userId) {
    throw Object.assign(new Error('userId is required'), { status: 400 });
  }

  await requireWorkspaceRole(currentUserId, workspaceId, 'VIEWER');

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  // Check auth: ADMIN workspace or project canAdmin
  let hasAdmin = false;
  try {
    const membership = await requireWorkspaceRole(currentUserId, workspaceId, 'ADMIN');
    hasAdmin = !!membership;
  } catch (e) {
    const perm = await prisma.permission.findUnique({
      where: { userId_projectId: { userId: currentUserId, projectId } },
      select: { canAdmin: true },
    });
    hasAdmin = !!perm?.canAdmin;
  }
  if (!hasAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const updated = await prisma.permission.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: {
      ...(canRead !== undefined ? { canRead } : {}),
      ...(canWrite !== undefined ? { canWrite } : {}),
      ...(canExecute !== undefined ? { canExecute } : {}),
      ...(canAdmin !== undefined ? { canAdmin } : {}),
    },
    create: {
      userId,
      projectId,
      canRead: canRead ?? true,
      canWrite: canWrite ?? false,
      canExecute: canExecute ?? false,
      canAdmin: canAdmin ?? false,
    },
  });

  return { permission: updated };
}

// PUBLIC_INTERFACE
/**
 * enforceProjectPermission
 * Utility for controllers to check read/write/execute/admin permission quickly.
 * Requires user to be at least workspace VIEWER; then checks project Permission flags.
 * Throws 403 if not authorized.
 */
async function enforceProjectPermission(userId, workspaceId, projectId, required = 'read') {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  const perm = await prisma.permission.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  const checks = {
    read: (p) => p?.canRead === true || p?.canAdmin === true,
    write: (p) => p?.canWrite === true || p?.canAdmin === true,
    execute: (p) => p?.canExecute === true || p?.canAdmin === true,
    admin: (p) => p?.canAdmin === true,
  };

  const ok = checks[required]?.(perm);
  if (!ok) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return true;
}

module.exports = {
  getWorkspaceRoles,
  setWorkspaceRole,
  getProjectPermissions,
  setProjectPermission,
  enforceProjectPermission,
};
