'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware');
const ciRunsController = require('../controllers/ciRuns');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: CI
 *   description: Continuous Integration run status and results
 */

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/ci-runs:
 *   get:
 *     summary: List CI runs for a project (VIEWER+)
 *     description: Returns CI runs for a project. Supports filtering by environmentId, status, and branch.
 *     tags: [CI]
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
 *       - in: query
 *         name: environmentId
 *         schema: { type: string }
 *         description: Filter by environment ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [QUEUED, RUNNING, PASSED, FAILED, CANCELED] }
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0, minimum: 0 }
 *     responses:
 *       200:
 *         description: List of CI runs
 */
router.get('/', authMiddleware, ciRunsController.list.bind(ciRunsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/ci-runs:
 *   post:
 *     summary: Create a CI run (MAINTAINER+ or CI system)
 *     description: Records a new CI run with initial status and metadata.
 *     tags: [CI]
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
 *             required: [status]
 *             properties:
 *               environmentId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [QUEUED, RUNNING, PASSED, FAILED, CANCELED]
 *               commitSha:
 *                 type: string
 *               branch:
 *                 type: string
 *               logsUrl:
 *                 type: string
 *               triggeredById:
 *                 type: string
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               finishedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: CI run created
 */
router.post('/', authMiddleware, ciRunsController.create.bind(ciRunsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/ci-runs/{ciRunId}:
 *   get:
 *     summary: Get CI run details (VIEWER+)
 *     tags: [CI]
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
 *         name: ciRunId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CI run
 *       404:
 *         description: Not found
 */
router.get('/:ciRunId', authMiddleware, ciRunsController.get.bind(ciRunsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/ci-runs/{ciRunId}:
 *   put:
 *     summary: Update CI run (MAINTAINER+ or CI system)
 *     tags: [CI]
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
 *         name: ciRunId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [QUEUED, RUNNING, PASSED, FAILED, CANCELED]
 *               logsUrl:
 *                 type: string
 *               finishedAt:
 *                 type: string
 *                 format: date-time
 *               commitSha:
 *                 type: string
 *               branch:
 *                 type: string
 *               environmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: CI run updated
 *       404:
 *         description: Not found
 */
router.put('/:ciRunId', authMiddleware, ciRunsController.update.bind(ciRunsController));

/**
 * @swagger
 * /workspaces/{workspaceId}/projects/{projectId}/ci-runs/latest:
 *   get:
 *     summary: Get latest CI run for a project (VIEWER+)
 *     description: Optionally filter by branch and environmentId
 *     tags: [CI]
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
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *       - in: query
 *         name: environmentId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Latest CI run or null
 */
router.get('/latest', authMiddleware, ciRunsController.latest.bind(ciRunsController));

module.exports = router;
