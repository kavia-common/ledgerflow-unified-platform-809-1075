'use strict';

const express = require('express');
const settingsController = require('../controllers/settings');
const { authMiddleware } = require('../middleware');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Manage API tokens and access control for users and workspaces
 */

/**
 * @swagger
 * /settings/api-tokens:
 *   get:
 *     summary: List API tokens for current user
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API tokens
 */
router.get('/settings/api-tokens', authMiddleware, settingsController.listApiTokens.bind(settingsController));

/**
 * @swagger
 * /settings/api-tokens:
 *   post:
 *     summary: Create a new API token
 *     description: Creates an API token for the current user. The plain token is returned once and cannot be retrieved later.
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-friendly token label
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of scopes
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiry
 *     responses:
 *       201:
 *         description: Token created
 */
router.post('/settings/api-tokens', authMiddleware, settingsController.createApiToken.bind(settingsController));

/**
 * @swagger
 * /settings/api-tokens/{tokenId}:
 *   delete:
 *     summary: Revoke an API token
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token revoked
 *       404:
 *         description: Not found
 *       403:
 *         description: Forbidden
 */
router.delete('/settings/api-tokens/:tokenId', authMiddleware, settingsController.revokeApiToken.bind(settingsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/settings/access:
 *   get:
 *     summary: List members and roles for a workspace (ADMIN+)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Members and roles
 *       403:
 *         description: Forbidden
 */
router.get('/workspaces/:workspaceId/settings/access', authMiddleware, settingsController.listWorkspaceAccess.bind(settingsController));

module.exports = router;
