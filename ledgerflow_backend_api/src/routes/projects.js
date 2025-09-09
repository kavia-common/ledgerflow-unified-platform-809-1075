'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const projectsController = require('../controllers/projects');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management within a workspace
 */

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   get:
 *     summary: List projects in a workspace
 *     tags: [Projects]
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
 *         description: List of projects
 */
router.get('/', authMiddleware, projectsController.list.bind(projectsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects:
 *   post:
 *     summary: Create a new project in a workspace (MAINTAINER+)
 *     tags: [Projects]
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
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               defaultBranch:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *       409:
 *         description: Duplicate slug
 */
router.post('/', authMiddleware, projectsController.create.bind(projectsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}:
 *   get:
 *     summary: Get a project
 *     tags: [Projects]
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
 *         description: Project
 *       404:
 *         description: Not found
 */
router.get('/:projectId', authMiddleware, projectsController.get.bind(projectsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}:
 *   put:
 *     summary: Update a project (MAINTAINER+)
 *     tags: [Projects]
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
 *               defaultBranch:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: Forbidden
 */
router.put('/:projectId', authMiddleware, projectsController.update.bind(projectsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}:
 *   delete:
 *     summary: Delete a project (ADMIN+)
 *     tags: [Projects]
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
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:projectId', authMiddleware, projectsController.remove.bind(projectsController));

module.exports = router;
