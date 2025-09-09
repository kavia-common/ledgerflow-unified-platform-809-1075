'use strict';

const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

/**
 * Permission model:
 * - VIEWER: can list and view environments for projects in the workspace.
 * - MAINTAINER: can create/update environments.
 * - ADMIN: can delete environments.
 */

// PUBLIC_INTERFACE
/**
 * listEnvironments
 * List all environments for a project within a workspace.
 * Requires workspace VIEWER or above.
 */
async function listEnvironments(userId, workspaceId, projectId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  // ensure project belongs to workspace
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  const environments = await prisma.environment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  return { environments };
}

// PUBLIC_INTERFACE
/**
 * getEnvironment
 * Get a single environment by id for a project within a workspace.
 * Requires workspace VIEWER or above.
 */
async function getEnvironment(userId, workspaceId, projectId, environmentId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const env = await prisma.environment.findFirst({
    where: { id: environmentId, projectId, project: { workspaceId } },
  });
  if (!env) {
    throw Object.assign(new Error('Environment not found'), { status: 404 });
  }
  return { environment: env };
}

// PUBLIC_INTERFACE
/**
 * createEnvironment
 * Create a new environment under a project.
 * Body requires: name (unique per project), type (DEVELOPMENT|STAGING|PRODUCTION)
 * Optional: url, status, configJson
 * Requires workspace MAINTAINER or above.
 */
async function createEnvironment(userId, workspaceId, projectId, { name, type, url, status, configJson }) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  if (!name || !type) {
    throw Object.assign(new Error('name and type are required'), { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  // Check duplicate by composite unique (projectId, name)
  const dup = await prisma.environment.findUnique({
    where: { projectId_name: { projectId, name } },
  });
  if (dup) {
    throw Object.assign(new Error('Environment name already exists for this project'), { status: 409 });
  }

  const environment = await prisma.environment.create({
    data: {
      projectId,
      name,
      type,
      url: url || null,
      status: status || null,
      // configJson can be object or stringified JSON; Prisma Json will accept objects
      configJson: configJson ?? null,
    },
  });

  return { environment };
}

// PUBLIC_INTERFACE
/**
 * updateEnvironment
 * Update fields of an environment. Supports partial updates.
 * Fields: name, type, url, status, configJson
 * Requires workspace MAINTAINER or above.
 */
async function updateEnvironment(userId, workspaceId, projectId, environmentId, { name, type, url, status, configJson }) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  const env = await prisma.environment.findFirst({
    where: { id: environmentId, projectId, project: { workspaceId } },
  });
  if (!env) {
    throw Object.assign(new Error('Environment not found'), { status: 404 });
  }

  // If changing name, ensure uniqueness in project
  if (name && name !== env.name) {
    const existing = await prisma.environment.findUnique({
      where: { projectId_name: { projectId, name } },
    });
    if (existing && existing.id !== environmentId) {
      throw Object.assign(new Error('Environment name already exists for this project'), { status: 409 });
    }
  }

  const updated = await prisma.environment.update({
    where: { id: environmentId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(configJson !== undefined ? { configJson } : {}),
    },
  });

  return { environment: updated };
}

// PUBLIC_INTERFACE
/**
 * deleteEnvironment
 * Delete an environment record.
 * Requires workspace ADMIN or above.
 */
async function deleteEnvironment(userId, workspaceId, projectId, environmentId) {
  await requireWorkspaceRole(userId, workspaceId, 'ADMIN');

  const env = await prisma.environment.findFirst({
    where: { id: environmentId, projectId, project: { workspaceId } },
    select: { id: true },
  });
  if (!env) {
    throw Object.assign(new Error('Environment not found'), { status: 404 });
  }

  await prisma.environment.delete({ where: { id: environmentId } });
  return { success: true };
}

module.exports = {
  listEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
};
