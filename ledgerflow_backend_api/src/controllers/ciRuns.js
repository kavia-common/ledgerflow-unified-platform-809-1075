'use strict';

const ciRunsService = require('../services/ciRuns');

/**
 * CI Runs Controller
 * Provides REST endpoints for listing CI runs, creating/updating runs (by CI system or user), and retrieving run details and latest status.
 */
class CiRunsController {
  // PUBLIC_INTERFACE
  /**
   * list
   * List CI runs for a project. Supports query params: environmentId, status, branch, limit, offset
   */
  async list(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const { environmentId, status, branch, limit, offset } = req.query || {};
      const result = await ciRunsService.listCiRuns(userId, workspaceId, projectId, {
        environmentId,
        status,
        branch,
        limit,
        offset,
      });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list CI runs' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * get
   * Get a single CI run by id
   */
  async get(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId, ciRunId } = req.params;
      const result = await ciRunsService.getCiRun(userId, workspaceId, projectId, ciRunId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get CI run' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * create
   * Create a CI run record
   */
  async create(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const payload = req.body || {};
      const result = await ciRunsService.createCiRun(userId, workspaceId, projectId, payload);
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to create CI run' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * update
   * Update an existing CI run (status, logsUrl, finishedAt, etc.)
   */
  async update(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId, ciRunId } = req.params;
      const payload = req.body || {};
      const result = await ciRunsService.updateCiRun(userId, workspaceId, projectId, ciRunId, payload);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to update CI run' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * latest
   * Get latest CI run for a project (optionally filter by branch/environment)
   */
  async latest(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const { branch, environmentId } = req.query || {};
      const result = await ciRunsService.getLatestCiStatus(userId, workspaceId, projectId, { branch, environmentId });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get latest CI status' });
    }
  }
}

module.exports = new CiRunsController();
