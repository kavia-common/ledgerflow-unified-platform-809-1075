'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const permissionsController = require('../controllers/permissions');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Workspace roles and project permissions management
 */

/**
 * @swagger
 * /workspaces/{workspaceId}/roles:
 *   get:
 *     summary: Get workspace members and roles (ADMIN+)
 *     tags: [Permissions]
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
router.get(
  '/workspaces/:workspaceId/roles',
  authMiddleware,
  permissionsController.getWorkspaceRoles.bind(permissionsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/roles:
 *   put:
 *     summary: Set a user's role in workspace (ADMIN+, OWNER for OWNER changes)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId, role]
 *             properties:
 *               targetUserId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MAINTAINER, DEVELOPER, VIEWER]
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Forbidden
 */
router.put(
  '/workspaces/:workspaceId/roles',
  authMiddleware,
  permissionsController.setWorkspaceRole.bind(permissionsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/permissions:
 *   get:
 *     summary: Get project user permissions (ADMIN+ or canAdmin)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of project permissions
 *       403:
 *         description: Forbidden
 */
router.get(
  '/workspaces/:workspaceId/projects/:projectId/permissions',
  authMiddleware,
  permissionsController.getProjectPermissions.bind(permissionsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/permissions:
 *   put:
 *     summary: Set a user's project permissions (ADMIN+ or canAdmin)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *               canRead:
 *                 type: boolean
 *               canWrite:
 *                 type: boolean
 *               canExecute:
 *                 type: boolean
 *               canAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permission updated
 *       403:
 *         description: Forbidden
 */
router.put(
  '/workspaces/:workspaceId/projects/:projectId/permissions',
  authMiddleware,
  permissionsController.setProjectPermission.bind(permissionsController)
);

module.exports = router;
