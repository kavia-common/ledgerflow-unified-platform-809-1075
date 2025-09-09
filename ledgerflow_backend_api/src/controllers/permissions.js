'use strict';

const permissionsService = require('../services/permissions');

/**
 * Permissions Controller
 * Provides endpoints to get/set workspace roles and project permissions.
 */
class PermissionsController {
  // PUBLIC_INTERFACE
  /** Get workspace members and roles (ADMIN+) */
  async getWorkspaceRoles(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await permissionsService.getWorkspaceRoles(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get workspace roles' });
    }
  }

  // PUBLIC_INTERFACE
  /** Set a user's role in a workspace */
  async setWorkspaceRole(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const { targetUserId, role } = req.body || {};
      const result = await permissionsService.setWorkspaceRole(userId, workspaceId, { userId: targetUserId, role });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to set workspace role' });
    }
  }

  // PUBLIC_INTERFACE
  /** Get project permissions (ADMIN+ or canAdmin) */
  async getProjectPermissions(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await permissionsService.getProjectPermissions(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get project permissions' });
    }
  }

  // PUBLIC_INTERFACE
  /** Set a user's project permissions (ADMIN+ or canAdmin) */
  async setProjectPermission(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const { targetUserId, canRead, canWrite, canExecute, canAdmin } = req.body || {};
      const result = await permissionsService.setProjectPermission(
        userId,
        workspaceId,
        projectId,
        { userId: targetUserId, canRead, canWrite, canExecute, canAdmin }
      );
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to set project permission' });
    }
  }
}

module.exports = new PermissionsController();
