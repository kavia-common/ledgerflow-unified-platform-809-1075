'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const environmentsController = require('../controllers/environments');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Environments
 *   description: Manage dev/staging/production environment metadata and configuration
 */

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/environments:
 *   get:
 *     summary: List environments for a project (VIEWER+)
 *     description: Returns all environments for the specified project in the workspace.
 *     tags: [Environments]
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
 *         description: List of environments
 */
router.get(
  '/',
  authMiddleware,
  environmentsController.list.bind(environmentsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/environments:
 *   post:
 *     summary: Create an environment (MAINTAINER+)
 *     description: Create a new environment for the project. Name must be unique per project.
 *     tags: [Environments]
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
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Environment display name (unique per project), e.g., "Development"
 *               type:
 *                 type: string
 *                 enum: [DEVELOPMENT, STAGING, PRODUCTION]
 *               url:
 *                 type: string
 *                 description: Public URL for this environment
 *               status:
 *                 type: string
 *                 description: Health status e.g., "healthy", "degraded"
 *               configJson:
 *                 type: object
 *                 description: Arbitrary JSON configuration
 *     responses:
 *       201:
 *         description: Environment created
 *       409:
 *         description: Duplicate name
 */
router.post(
  '/',
  authMiddleware,
  environmentsController.create.bind(environmentsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/environments/{environmentId}:
 *   get:
 *     summary: Get an environment (VIEWER+)
 *     tags: [Environments]
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
 *       - in: path
 *         name: environmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Environment
 *       404:
 *         description: Not found
 */
router.get(
  '/:environmentId',
  authMiddleware,
  environmentsController.get.bind(environmentsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/environments/{environmentId}:
 *   put:
 *     summary: Update an environment (MAINTAINER+)
 *     tags: [Environments]
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
 *       - in: path
 *         name: environmentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DEVELOPMENT, STAGING, PRODUCTION]
 *               url:
 *                 type: string
 *               status:
 *                 type: string
 *               configJson:
 *                 type: object
 *     responses:
 *       200:
 *         description: Environment updated
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:environmentId',
  authMiddleware,
  environmentsController.update.bind(environmentsController)
);

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/environments/{environmentId}:
 *   delete:
 *     summary: Delete an environment (ADMIN+)
 *     tags: [Environments]
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
 *       - in: path
 *         name: environmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:environmentId',
  authMiddleware,
  environmentsController.remove.bind(environmentsController)
);

module.exports = router;
