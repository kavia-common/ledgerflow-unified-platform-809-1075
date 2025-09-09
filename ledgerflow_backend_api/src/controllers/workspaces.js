'use strict';

const workspacesService = require('../services/workspaces');

/**
 * Workspaces Controller
 * CRUD and membership actions for workspaces.
 */
class WorkspacesController {
  // PUBLIC_INTERFACE
  /** List workspaces user is a member of */
  async list(req, res) {
    try {
      const userId = req.user?.sub;
      const result = await workspacesService.listWorkspaces(userId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list workspaces' });
    }
  }

  // PUBLIC_INTERFACE
  /** Create a workspace (current user becomes OWNER) */
  async create(req, res) {
    try {
      const userId = req.user?.sub;
      const { name, slug, description } = req.body || {};
      const result = await workspacesService.createWorkspace(userId, { name, slug, description });
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to create workspace' });
    }
  }

  // PUBLIC_INTERFACE
  /** Get a workspace by id (must be member) */
  async get(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await workspacesService.getWorkspace(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get workspace' });
    }
  }

  // PUBLIC_INTERFACE
  /** Update a workspace (ADMIN+) */
  async update(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const { name, description, slug } = req.body || {};
      const result = await workspacesService.updateWorkspace(userId, workspaceId, { name, description, slug });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to update workspace' });
    }
  }

  // PUBLIC_INTERFACE
  /** Delete a workspace (OWNER only) */
  async remove(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await workspacesService.deleteWorkspace(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to delete workspace' });
    }
  }

  // PUBLIC_INTERFACE
  /** List members and roles in a workspace (ADMIN+) */
  async listMembers(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await workspacesService.listMembers(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list members' });
    }
  }

  // PUBLIC_INTERFACE
  /** Invite/add a member by email (ADMIN+, stub for email) */
  async invite(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const { email, role } = req.body || {};
      const result = await workspacesService.inviteMember(userId, workspaceId, { email, role });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to invite member' });
    }
  }
}

module.exports = new WorkspacesController();
