const express = require('express');
const healthController = require('../controllers/health');
const authRoutes = require('./auth');
const workspaceRoutes = require('./workspaces');
const projectsRoutes = require('./projects');

const router = express.Router();
// Health endpoint

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

// Mount auth routes under /auth
router.use('/auth', authRoutes);

// Mount workspaces and nested projects
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/projects', projectsRoutes);

module.exports = router;
