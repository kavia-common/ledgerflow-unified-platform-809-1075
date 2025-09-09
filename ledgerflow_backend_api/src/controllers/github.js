'use strict';

const githubService = require('../services/github');

/**
 * GitHub Integration Controller
 * Provides endpoints to link/unlink GitHub repos to projects and handle webhook callbacks.
 */
class GitHubController {
  // PUBLIC_INTERFACE
  /**
   * link
   * Link a GitHub repository to a project.
   * Body:
   *  - installationId?: number
   *  - repoOwner: string
   *  - repoName: string
   *  - repoId?: number
   *  - defaultBranch?: string
   */
  async link(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const payload = req.body || {};
      const result = await githubService.linkRepoToProject(userId, workspaceId, projectId, payload);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to link repository' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * unlink
   * Remove the GitHub repository link from the project.
   */
  async unlink(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await githubService.unlinkRepoFromProject(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to unlink repository' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * getLink
   * Get current GitHub repo link metadata for a project.
   */
  async getLink(req, res) {
    try {
      const userId = req.user?.sub;
      const { workspaceId, projectId } = req.params;
      const result = await githubService.getRepoLink(userId, workspaceId, projectId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to get repository link' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * webhook
   * Handle GitHub webhook callbacks.
   * Note: This endpoint should accept raw body for signature verification.
   */
  async webhook(req, res) {
    try {
      const { workspaceId, projectId } = req.params;
      const headers = req.headers || {};
      // rawBody is attached via custom middleware in route to capture signature
      const rawBody = req.rawBody || JSON.stringify(req.body || {});
      const result = await githubService.handleWebhook(workspaceId, projectId, rawBody, headers);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Webhook handling failed' });
    }
  }
}

module.exports = new GitHubController();
