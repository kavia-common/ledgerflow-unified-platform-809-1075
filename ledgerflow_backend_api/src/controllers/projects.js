'use strict';

const projectsService = require('../services/projects');

/**
 * Projects Controller
 * CRUD within a workspace.
 */
class ProjectsController {
  // PUBLIC_INTERFACE
  /** List projects in a workspace (VIEWER+) */
  async list(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await projectsService.listProjects(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list projects' });
    }
  }

  // PUBLIC_INTERFACE
  /** Create project (MAINTAINER+) */
  async create(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const { name, slug, description, defaultBranch } = req.body || {};
      const result = await projectsService.createProject(userId, workspaceId, { name, slug, description, defaultBranch });
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to create project' });
    }
  }

  // PUBLIC_INTERFACE
  /** Get a project (VIEWER+) */
  async get(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await projectsService.getProject(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get project' });
    }
  }

  // PUBLIC_INTERFACE
  /** Update a project (MAINTAINER+) */
  async update(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const { name, slug, description, defaultBranch } = req.body || {};
      const result = await projectsService.updateProject(userId, workspaceId, projectId, { name, slug, description, defaultBranch });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to update project' });
    }
  }

  // PUBLIC_INTERFACE
  /** Delete a project (ADMIN+) */
  async remove(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await projectsService.deleteProject(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to delete project' });
    }
  }
}

module.exports = new ProjectsController();
