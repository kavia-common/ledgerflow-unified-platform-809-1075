'use strict';

const environmentsService = require('../services/environments');

/**
 * Environments Controller
 * Handles CRUD for project environments (Development, Staging, Production).
 */
class EnvironmentsController {
  // PUBLIC_INTERFACE
  /**
   * List environments for a project (VIEWER+)
   */
  async list(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await environmentsService.listEnvironments(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list environments' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single environment (VIEWER+)
   */
  async get(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId, environmentId } = req.params;
      const result = await environmentsService.getEnvironment(userId, workspaceId, projectId, environmentId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get environment' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create environment (MAINTAINER+)
   */
  async create(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const { name, type, url, status, configJson } = req.body || {};
      const result = await environmentsService.createEnvironment(userId, workspaceId, projectId, {
        name,
        type,
        url,
        status,
        configJson,
      });
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to create environment' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update environment (MAINTAINER+)
   */
  async update(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId, environmentId } = req.params;
      const { name, type, url, status, configJson } = req.body || {};
      const result = await environmentsService.updateEnvironment(
        userId,
        workspaceId,
        projectId,
        environmentId,
        { name, type, url, status, configJson }
      );
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to update environment' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete environment (ADMIN+)
   */
  async remove(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId, environmentId } = req.params;
      const result = await environmentsService.deleteEnvironment(userId, workspaceId, projectId, environmentId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to delete environment' });
    }
  }
}

module.exports = new EnvironmentsController();
