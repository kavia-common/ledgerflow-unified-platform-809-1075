'use strict';

const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

/**
 * CI Runs service
 * Handles listing, creation, update, and retrieval of CI run records under a workspace/project scope.
 * Permissions:
 *  - List/get: workspace VIEWER+
 *  - Create/update (by CI system or user): workspace DEVELOPER+ (adjust as needed) or project canExecute/canAdmin recommended; for now we allow MAINTAINER+.
 */

// Helpers
function ensureProjectInWorkspace(projectId, workspaceId) {
  return prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
}

// PUBLIC_INTERFACE
/**
 * listCiRuns
 * List CI runs for a project, optionally filtered by environmentId or status.
 * Requires workspace VIEWER or above.
 */
async function listCiRuns(userId, workspaceId, projectId, { environmentId, status, branch, limit = 50, offset = 0 } = {}) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const project = await ensureProjectInWorkspace(projectId, workspaceId);
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  const where = {
    projectId,
    ...(environmentId ? { environmentId } : {}),
    ...(status ? { status } : {}),
    ...(branch ? { branch } : {}),
  };

  const [total, runs] = await Promise.all([
    prisma.ciRun.count({ where }),
    prisma.ciRun.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }],
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0,
      include: {
        environment: true,
        triggeredBy: {
          select: { id: true, email: true, name: true, imageUrl: true },
        },
      },
    }),
  ]);

  return { total, runs };
}

// PUBLIC_INTERFACE
/**
 * getCiRun
 * Retrieve a single CI run by ID under a workspace/project.
 * Requires workspace VIEWER or above.
 */
async function getCiRun(userId, workspaceId, projectId, ciRunId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const run = await prisma.ciRun.findFirst({
    where: { id: ciRunId, projectId, project: { workspaceId } },
    include: {
      environment: true,
      triggeredBy: { select: { id: true, email: true, name: true, imageUrl: true } },
    },
  });
  if (!run) {
    throw Object.assign(new Error('CI run not found'), { status: 404 });
  }
  return { run };
}

// PUBLIC_INTERFACE
/**
 * createCiRun
 * Create a new CI run record for a project.
 * Body can include:
 *  - environmentId?: string
 *  - status: CiStatus (QUEUED|RUNNING|PASSED|FAILED|CANCELED)
 *  - commitSha?: string
 *  - branch?: string
 *  - logsUrl?: string
 *  - triggeredById?: string (if the user triggering is known; otherwise taken from requester)
 * Requires workspace MAINTAINER or above (to be safe, as it writes).
 */
async function createCiRun(userId, workspaceId, projectId, payload = {}) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  const project = await ensureProjectInWorkspace(projectId, workspaceId);
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  const {
    environmentId,
    status,
    commitSha,
    branch,
    logsUrl,
    triggeredById,
    startedAt, // optional override
    finishedAt, // optional if creating a finalized run
  } = payload;

  if (!status) {
    throw Object.assign(new Error('status is required'), { status: 400 });
  }

  // Validate environment belongs to same project if provided
  if (environmentId) {
    const env = await prisma.environment.findFirst({
      where: { id: environmentId, projectId },
      select: { id: true },
    });
    if (!env) {
      throw Object.assign(new Error('Invalid environmentId for this project'), { status: 400 });
    }
  }

  const run = await prisma.ciRun.create({
    data: {
      projectId,
      environmentId: environmentId || null,
      status,
      commitSha: commitSha || null,
      branch: branch || null,
      logsUrl: logsUrl || null,
      triggeredById: triggeredById || userId || null,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      finishedAt: finishedAt ? new Date(finishedAt) : null,
    },
  });

  return { run };
}

// PUBLIC_INTERFACE
/**
 * updateCiRun
 * Update an existing CI run status/metadata.
 * Body can include: status, logsUrl, finishedAt, commitSha, branch, environmentId.
 * Requires workspace MAINTAINER or above.
 */
async function updateCiRun(userId, workspaceId, projectId, ciRunId, payload = {}) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  const existing = await prisma.ciRun.findFirst({
    where: { id: ciRunId, projectId, project: { workspaceId } },
    select: { id: true, projectId: true },
  });
  if (!existing) {
    throw Object.assign(new Error('CI run not found'), { status: 404 });
  }

  const {
    status,
    logsUrl,
    finishedAt,
    commitSha,
    branch,
    environmentId,
  } = payload;

  if (environmentId) {
    const env = await prisma.environment.findFirst({
      where: { id: environmentId, projectId },
      select: { id: true },
    });
    if (!env) {
      throw Object.assign(new Error('Invalid environmentId for this project'), { status: 400 });
    }
  }

  const updated = await prisma.ciRun.update({
    where: { id: ciRunId },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(logsUrl !== undefined ? { logsUrl } : {}),
      ...(finishedAt !== undefined ? { finishedAt: finishedAt ? new Date(finishedAt) : null } : {}),
      ...(commitSha !== undefined ? { commitSha } : {}),
      ...(branch !== undefined ? { branch } : {}),
      ...(environmentId !== undefined ? { environmentId } : {}),
    },
  });

  return { run: updated };
}

// PUBLIC_INTERFACE
/**
 * getLatestCiStatus
 * Convenience endpoint to get the latest CI run for a project (optionally by branch or environment).
 * Requires workspace VIEWER+.
 */
async function getLatestCiStatus(userId, workspaceId, projectId, { branch, environmentId } = {}) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const where = {
    projectId,
    ...(branch ? { branch } : {}),
    ...(environmentId ? { environmentId } : {}),
  };

  const latest = await prisma.ciRun.findFirst({
    where,
    orderBy: [{ startedAt: 'desc' }],
  });

  if (!latest) {
    return { latest: null };
  }
  return { latest };
}

module.exports = {
  listCiRuns,
  getCiRun,
  createCiRun,
  updateCiRun,
  getLatestCiStatus,
};
