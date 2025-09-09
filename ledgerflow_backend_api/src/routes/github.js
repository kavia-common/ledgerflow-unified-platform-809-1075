'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const githubController = require('../controllers/github');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: GitHub
 *   description: GitHub integration for linking repositories and receiving webhooks
 */

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/github/link:
 *   put:
 *     summary: Link a GitHub repository to a project (MAINTAINER+)
 *     description: |
 *       Associates a GitHub repository with the specified project. Ensures uniqueness per repoOwner/repoName.
 *     tags: [GitHub]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [repoOwner, repoName]
 *             properties:
 *               installationId:
 *                 type: integer
 *                 description: GitHub App installation ID (if using GitHub App)
 *               repoOwner:
 *                 type: string
 *                 description: GitHub repository owner (org or user)
 *               repoName:
 *                 type: string
 *                 description: GitHub repository name
 *               repoId:
 *                 type: integer
 *                 description: Numeric GitHub repository ID
 *               defaultBranch:
 *                 type: string
 *                 description: Default branch name (e.g., main)
 *     responses:
 *       200:
 *         description: Link created/updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Project not found
 *       409:
 *         description: Repo already linked to another project
 */
router.put('/link', authMiddleware, githubController.link.bind(githubController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/github/link:
 *   get:
 *     summary: Get GitHub repo link metadata (VIEWER+)
 *     tags: [GitHub]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current link (or null)
 */
router.get('/link', authMiddleware, githubController.getLink.bind(githubController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/github/link:
 *   delete:
 *     summary: Unlink GitHub repository from project (MAINTAINER+)
 *     tags: [GitHub]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unlinked
 */
router.delete('/link', authMiddleware, githubController.unlink.bind(githubController));

/**
 * Raw body capture middleware for webhook route to preserve HMAC signature fidelity.
 * We parse raw buffer and also try to JSON parse to attach req.body for convenience.
 */
function rawBodySaver(req, res, buf) {
  if (buf && buf.length) {
    req.rawBody = buf.toString('utf8');
  } else {
    req.rawBody = '';
  }
}
const jsonRawParser = express.json({ verify: rawBodySaver });

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/github/webhook:
 *   post:
 *     summary: GitHub webhook receiver (signature verified - stub)
 *     description: |
 *       Receives GitHub webhook events for a linked project. Signature verification is stubbed here using HMAC SHA-256 against a per-project or global GITHUB_WEBHOOK_SECRET.
 *     tags: [GitHub]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Webhook accepted
 *       401:
 *         description: Invalid signature
 *       404:
 *         description: Project not linked
 */
router.post('/webhook', jsonRawParser, githubController.webhook.bind(githubController));

module.exports = router;
