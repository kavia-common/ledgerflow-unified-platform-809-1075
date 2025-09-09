'use strict';

const settingsService = require('../services/settings');

/**
 * Settings Controller
 * Manages API tokens and access controls for the current user.
 */
class SettingsController {
  // PUBLIC_INTERFACE
  /** Create an API token for current user */
  async createApiToken(req, res) {
    try {
      const userId = req.user?.sub;
      const { name, scopes, expiresAt } = req.body || {};
      const result = await settingsService.createApiToken(userId, { name, scopes, expiresAt });
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to create API token' });
    }
  }

  // PUBLIC_INTERFACE
  /** List API tokens for current user */
  async listApiTokens(req, res) {
    try {
      const userId = req.user?.sub;
      const result = await settingsService.listApiTokens(userId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list API tokens' });
    }
  }

  // PUBLIC_INTERFACE
  /** Revoke an API token by id (must be owner) */
  async revokeApiToken(req, res) {
    try {
      const userId = req.user?.sub;
      const { tokenId } = req.params;
      const result = await settingsService.revokeApiToken(userId, tokenId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to revoke API token' });
    }
  }

  // PUBLIC_INTERFACE
  /** List workspace access (ADMIN+) to support settings access-control management pages */
  async listWorkspaceAccess(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId } = req.params;
      const result = await settingsService.listWorkspaceAccess(userId, workspaceId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to list workspace access' });
    }
  }
}

module.exports = new SettingsController();
