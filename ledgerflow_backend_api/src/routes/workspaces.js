'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const workspacesController = require('../controllers/workspaces');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Workspace management
 */

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: List workspaces for current user
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 */
router.get('/', authMiddleware, workspacesController.list.bind(workspacesController));

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 *       409:
 *         description: Slug already exists
 */
router.post('/', authMiddleware, workspacesController.create.bind(workspacesController));

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   get:
 *     summary: Get a workspace by id
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace
 *       404:
 *         description: Not found
 */
router.get('/:workspaceId', authMiddleware, workspacesController.get.bind(workspacesController));

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   put:
 *     summary: Update a workspace (ADMIN+)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated workspace
 *       403:
 *         description: Forbidden
 */
router.put('/:workspaceId', authMiddleware, workspacesController.update.bind(workspacesController));

/**
 * @swagger
 * /workspaces/{workspaceId}:
 *   delete:
 *     summary: Delete a workspace (OWNER only)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:workspaceId', authMiddleware, workspacesController.remove.bind(workspacesController));

/**
 * @swagger
 * /workspaces/{workspaceId}/members:
 *   get:
 *     summary: List members and roles (ADMIN+)
 *     tags: [Workspaces]
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
 *         description: List of members
 *       403:
 *         description: Forbidden
 */
router.get('/:workspaceId/members', authMiddleware, workspacesController.listMembers.bind(workspacesController));

/**
 * @swagger
 * /workspaces/{workspaceId}/invite:
 *   post:
 *     summary: Invite/add a member by email (ADMIN+)
 *     tags: [Workspaces]
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
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MAINTAINER, DEVELOPER, VIEWER]
 *     responses:
 *       200:
 *         description: Invite processed
 *       403:
 *         description: Forbidden
 */
router.post('/:workspaceId/invite', authMiddleware, workspacesController.invite.bind(workspacesController));

module.exports = router;
