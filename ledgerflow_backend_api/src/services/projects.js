'use strict';

const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

// PUBLIC_INTERFACE
/**
 * listProjects
 * Lists projects in a workspace visible to the user (requires workspace VIEWER).
 */
async function listProjects(userId, workspaceId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
  return { projects };
}

// PUBLIC_INTERFACE
/**
 * createProject
 * Creates a new project within a workspace (requires MAINTAINER).
 * Required fields: name, slug
 */
async function createProject(userId, workspaceId, { name, slug, description, defaultBranch }) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');
  if (!name || !slug) {
    throw Object.assign(new Error('name and slug are required'), { status: 400 });
  }

  const dup = await prisma.project.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });
  if (dup) {
    throw Object.assign(new Error('Project slug already exists in this workspace'), { status: 409 });
  }

  const project = await prisma.project.create({
    data: {
      workspaceId,
      name,
      slug,
      description: description || null,
      defaultBranch: defaultBranch || null,
    },
  });
  return { project };
}

// PUBLIC_INTERFACE
/**
 * getProject
 * Returns a project if the user is at least a workspace VIEWER.
 */
async function getProject(userId, workspaceId, projectId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }
  return { project };
}

// PUBLIC_INTERFACE
/**
 * updateProject
 * Updates project fields (requires MAINTAINER).
 */
async function updateProject(userId, workspaceId, projectId, { name, slug, description, defaultBranch }) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  if (slug) {
    const existing = await prisma.project.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
    });
    if (existing && existing.id !== projectId) {
      throw Object.assign(new Error('Project slug already exists in this workspace'), { status: 409 });
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(defaultBranch !== undefined ? { defaultBranch } : {}),
    },
  });
  return { project };
}

// PUBLIC_INTERFACE
/**
 * deleteProject
 * Deletes a project (requires ADMIN).
 */
async function deleteProject(userId, workspaceId, projectId) {
  await requireWorkspaceRole(userId, workspaceId, 'ADMIN');
  // ensure project belongs to workspace
  const proj = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!proj) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }
  await prisma.project.delete({ where: { id: projectId } });
  return { success: true };
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
