'use strict';

const { enforceProjectPermission } = require('../services/permissions');

// PUBLIC_INTERFACE
/**
 * requireProjectPermission(required)
 * Express middleware factory to enforce project-level permissions.
 * Usage: router.get('/:projectId/resource', authMiddleware, requireProjectPermission('read'), handler)
 * Params in req.params: workspaceId, projectId
 */
function requireProjectPermission(required = 'read') {
  return async function (req, res, next) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params || {};
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!workspaceId || !projectId) {
        return res.status(400).json({ error: 'workspaceId and projectId are required in path' });
      }
      await enforceProjectPermission(userId, workspaceId, projectId, required);
      next();
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Permission check failed' });
    }
  };
}

module.exports = {
  requireProjectPermission,
};
