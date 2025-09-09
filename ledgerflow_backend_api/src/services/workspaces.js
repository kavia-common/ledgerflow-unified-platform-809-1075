'use strict';

const prisma = require('../lib/prisma');
const { Role } = require('@prisma/client');

/**
 * Utility to check if a role has at least the required role level.
 * Role hierarchy: OWNER > ADMIN > MAINTAINER > DEVELOPER > VIEWER
 */
const ROLE_ORDER = {
  OWNER: 5,
  ADMIN: 4,
  MAINTAINER: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

// PUBLIC_INTERFACE
/**
 * requireWorkspaceRole
 * Ensures the given user has at least the required role in the workspace.
 * Throws a 403 error if not authorized or 404 if workspace does not exist / not a member.
 */
async function requireWorkspaceRole(userId, workspaceId, requiredRole = 'VIEWER') {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!ws) {
    throw Object.assign(new Error('Workspace not found'), { status: 404 });
  }
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
  if (!membership) {
    throw Object.assign(new Error('Forbidden: not a workspace member'), { status: 403 });
  }
  if (ROLE_ORDER[membership.role] < ROLE_ORDER[requiredRole]) {
    throw Object.assign(new Error('Forbidden: insufficient role'), { status: 403 });
  }
  return membership;
}

// PUBLIC_INTERFACE
/**
 * listWorkspaces
 * Lists workspaces visible to the user (i.e., where user is a member).
 */
async function listWorkspaces(userId) {
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { workspaces };
}

// PUBLIC_INTERFACE
/**
 * createWorkspace
 * Creates a workspace with the current user as OWNER. Also creates membership.
 * Params: { name, slug, description? }
 */
async function createWorkspace(userId, { name, slug, description }) {
  if (!name || !slug) {
    throw Object.assign(new Error('name and slug are required'), { status: 400 });
  }

  // Ensure unique slug
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    throw Object.assign(new Error('Workspace slug already exists'), { status: 409 });
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        ownerId: userId,
      },
    });
    await tx.membership.create({
      data: {
        userId,
        workspaceId: ws.id,
        role: Role.OWNER,
      },
    });
    return ws;
  });

  return { workspace };
}

// PUBLIC_INTERFACE
/**
 * getWorkspace
 * Returns a workspace by id if the user is a member.
 */
async function getWorkspace(userId, workspaceId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    throw Object.assign(new Error('Workspace not found'), { status: 404 });
  }
  return { workspace };
}

// PUBLIC_INTERFACE
/**
 * updateWorkspace
 * Updates name/description/slug. Requires ADMIN or above.
 */
async function updateWorkspace(userId, workspaceId, { name, description, slug }) {
  await requireWorkspaceRole(userId, workspaceId, 'ADMIN');

  if (slug) {
    const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.id !== workspaceId) {
      throw Object.assign(new Error('Workspace slug already exists'), { status: 409 });
    }
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(slug !== undefined ? { slug } : {}),
    },
  });
  return { workspace };
}

// PUBLIC_INTERFACE
/**
 * deleteWorkspace
 * Deletes a workspace. Requires OWNER.
 */
async function deleteWorkspace(userId, workspaceId) {
  await requireWorkspaceRole(userId, workspaceId, 'OWNER');
  await prisma.workspace.delete({ where: { id: workspaceId } });
  return { success: true };
}

// PUBLIC_INTERFACE
/**
 * listMembers
 * Lists memberships and roles for a workspace. Requires ADMIN or above.
 */
async function listMembers(userId, workspaceId) {
  await requireWorkspaceRole(userId, workspaceId, 'ADMIN');
  const members = await prisma.membership.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, email: true, name: true, imageUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return { members };
}

// PUBLIC_INTERFACE
/**
 * inviteMember
 * Stub that simulates inviting a user to the workspace by email.
 * - If user exists: create or update membership with provided role (default VIEWER).
 * - If user does not exist: returns a mock "email sent" response.
 * Requires ADMIN or above.
 */
async function inviteMember(userId, workspaceId, { email, role = 'VIEWER' }) {
  await requireWorkspaceRole(userId, workspaceId, 'ADMIN');
  if (!email) {
    throw Object.assign(new Error('email is required'), { status: 400 });
  }
  if (!ROLE_ORDER[role]) {
    throw Object.assign(new Error('invalid role'), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Mock sending email invite
    return {
      status: 'invited',
      message: `Invitation email sent to ${email} (mock).`,
    };
  }

  const membership = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    update: { role },
    create: { userId: user.id, workspaceId, role },
  });

  return { status: 'added', membership };
}

module.exports = {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  inviteMember,
  requireWorkspaceRole,
};
