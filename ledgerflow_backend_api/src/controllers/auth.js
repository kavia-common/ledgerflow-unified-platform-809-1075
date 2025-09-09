'use strict';

const authService = require('../services/auth');

/**
 * Authentication Controller
 * Handles incoming HTTP requests for signup, login, logout, refresh, and me.
 */
class AuthController {
  // PUBLIC_INTERFACE
  /**
   * signup
   * Request body:
   *  - email: string
   *  - password: string
   *  - name?: string
   * Response: 201 with { user, accessToken, refreshToken, sessionId }
   */
  async signup(req, res, next) {
    try {
      const { email, password, name } = req.body || {};
      const context = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      };
      const result = await authService.signup({ email, password, name }, context);
      return res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Signup failed' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * login
   * Request body:
   *  - email: string
   *  - password: string
   * Response: 200 with { user, accessToken, refreshToken, sessionId }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      const context = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      };
      const result = await authService.login({ email, password }, context);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Login failed' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * logout
   * Request body:
   *  - sessionToken?: string
   *  - refreshToken?: string
   * Response: 200 with { success: true }
   */
  async logout(req, res, next) {
    try {
      const { sessionToken, refreshToken } = req.body || {};
      const result = await authService.logout({ sessionToken, refreshToken });
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Logout failed' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * refresh
   * Request body:
   *  - sessionToken?: string
   *  - refreshToken: string
   * Response: 200 with { user, accessToken, refreshToken, sessionId }
   */
  async refresh(req, res, next) {
    try {
      const { sessionToken, refreshToken } = req.body || {};
      const context = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip,
      };
      const result = await authService.refresh({ sessionToken, refreshToken }, context);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Refresh failed' });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * me
   * Requires Authorization: Bearer <accessToken>
   * Response: 200 with { user }
   */
  async me(req, res, next) {
    try {
      const userId = req.user?.sub;
      const result = await authService.me(userId);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Failed to resolve user' });
    }
  }
}

module.exports = new AuthController();
