'use strict';

const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { requireWorkspaceRole } = require('./workspaces');

/**
 * Utilities for GitHub integration:
 * - Link/unlink a GitHub repository to a project
 * - Retrieve link metadata
 * - Handle GitHub webhooks (stubbed signature verification)
 */

// PUBLIC_INTERFACE
/**
 * linkRepoToProject
 * Link a GitHub repository to a project in a workspace.
 * Requires workspace MAINTAINER or above.
 * Params:
 *  - userId: string
 *  - workspaceId: string
 *  - projectId: string
 *  - payload: {
 *      installationId?: number,
 *      repoOwner: string,
 *      repoName: string,
 *      repoId?: number,
 *      defaultBranch?: string
 *    }
 * Returns:
 *  { link }
 */
async function linkRepoToProject(userId, workspaceId, projectId, payload = {}) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  const { installationId, repoOwner, repoName, repoId, defaultBranch } = payload;

  if (!repoOwner || !repoName) {
    throw Object.assign(new Error('repoOwner and repoName are required'), { status: 400 });
  }

  // Upsert ensures one link per project; also enforce unique repoOwner/repoName
  const existingByRepo = await prisma.gitHubRepoLink.findUnique({
    where: { unique_github_repo: { repoOwner, repoName } },
  });
  if (existingByRepo && existingByRepo.projectId !== projectId) {
    throw Object.assign(new Error('This GitHub repository is already linked to another project'), { status: 409 });
  }

  const link = await prisma.gitHubRepoLink.upsert({
    where: { projectId },
    update: {
      installationId: installationId !== undefined ? BigInt(installationId) : undefined,
      repoOwner,
      repoName,
      repoId: repoId !== undefined ? BigInt(repoId) : undefined,
      defaultBranch: defaultBranch ?? undefined,
      // webhookSecret can be set per project or default to env; keep null by default here
    },
    create: {
      projectId,
      installationId: installationId !== undefined ? BigInt(installationId) : null,
      repoOwner,
      repoName,
      repoId: repoId !== undefined ? BigInt(repoId) : null,
      defaultBranch: defaultBranch || null,
      webhookSecret: null,
    },
  });

  return { link };
}

// PUBLIC_INTERFACE
/**
 * unlinkRepoFromProject
 * Removes the GitHub link for a project.
 * Requires workspace MAINTAINER or above.
 * Returns: { success: true }
 */
async function unlinkRepoFromProject(userId, workspaceId, projectId) {
  await requireWorkspaceRole(userId, workspaceId, 'MAINTAINER');

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }

  // If not linked, treat as idempotent
  await prisma.gitHubRepoLink.delete({
    where: { projectId },
  }).catch(() => {});

  return { success: true };
}

// PUBLIC_INTERFACE
/**
 * getRepoLink
 * Retrieve the GitHub link metadata for a project (VIEWER+)
 */
async function getRepoLink(userId, workspaceId, projectId) {
  await requireWorkspaceRole(userId, workspaceId, 'VIEWER');

  const link = await prisma.gitHubRepoLink.findFirst({
    where: { projectId, project: { workspaceId } },
  });

  return { link };
}

/**
 * verifyGitHubSignature (stub)
 * Performs an HMAC SHA-256 signature check against the provided secret.
 * If project-specific webhookSecret is not set, falls back to process.env.GITHUB_WEBHOOK_SECRET.
 */
function verifyGitHubSignature(secret, payloadBody, signatureHeader) {
  if (!secret) {
    // If no secret available, we accept but log a warning for dev.
    return { ok: true, reason: 'No secret configured - skipping verification (dev stub)' };
  }
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payloadBody).digest('hex');
    const provided = signatureHeader || '';
    const ok = crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(provided));
    return { ok, reason: ok ? 'Verified' : 'Signature mismatch' };
  } catch (e) {
    return { ok: false, reason: 'Verification error' };
  }
}

// PUBLIC_INTERFACE
/**
 * handleWebhook
 * Handle incoming GitHub webhook for a given linked project.
 * The route should be unauthenticated and rely on signature verification.
 * Behavior: for now, just store basic CI event hints or log. This is a stub to integrate later with CI updates.
 * Returns: { received: true }
 */
async function handleWebhook(workspaceId, projectId, rawBody, headers) {
  // Load link to identify project and determine secret
  const link = await prisma.gitHubRepoLink.findFirst({
    where: { projectId, project: { workspaceId } },
  });
  if (!link) {
    throw Object.assign(new Error('No GitHub link for this project'), { status: 404 });
  }

  const signatureHeader = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
  const eventType = headers['x-github-event'] || headers['X-GitHub-Event'];
  const delivery = headers['x-github-delivery'] || headers['X-GitHub-Delivery'];

  const secret = link.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET || '';
  const { ok, reason } = verifyGitHubSignature(secret, rawBody, signatureHeader);

  if (!ok) {
    const err = new Error(`Invalid signature: ${reason}`);
    err.status = 401;
    throw err;
  }

  // Parse JSON
  let payload = {};
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch (e) {
    // ignore parsing error, keep empty payload
  }

  // Basic stub handling: push/pull_request/check_suite events etc. For now, we only acknowledge.
  // Future: Create CI run on push, update statuses, etc.
  return {
    received: true,
    eventType: eventType || null,
    deliveryId: delivery || null,
  };
}

module.exports = {
  linkRepoToProject,
  unlinkRepoFromProject,
  getRepoLink,
  handleWebhook,
};
