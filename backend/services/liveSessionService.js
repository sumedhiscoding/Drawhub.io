/**
 * Live Session Service
 * Manages active live sessions for canvases
 * Uses in-memory storage (can be upgraded to Redis for production)
 */

class LiveSessionService {
  constructor() {
    // Map of canvasId -> { ownerId, startedAt, participants: Set<userId> }
    this.activeSessions = new Map();
  }

  /**
   * Start a live session for a canvas
   * @param {string} canvasId - Canvas ID
   * @param {number} ownerId - Owner user ID
   * @returns {Object} Session info
   */
  startSession(canvasId, ownerId) {
    if (this.activeSessions.has(canvasId)) {
      // Session already exists, return existing session
      return this.activeSessions.get(canvasId);
    }

    const session = {
      canvasId,
      ownerId,
      startedAt: new Date(),
      participants: new Set([ownerId]),
    };

    this.activeSessions.set(canvasId, session);
    return session;
  }

  /**
   * Stop a live session
   * @param {string} canvasId - Canvas ID
   * @param {number} ownerId - Owner user ID (for authorization)
   * @returns {boolean} True if session was stopped
   */
  stopSession(canvasId, ownerId) {
    const session = this.activeSessions.get(canvasId);
    
    if (!session) {
      return false;
    }

    // Only owner can stop the session
    if (session.ownerId !== ownerId) {
      throw new Error('Only the session owner can stop the live session');
    }

    this.activeSessions.delete(canvasId);
    return true;
  }

  /**
   * Add a participant to a live session
   * @param {string} canvasId - Canvas ID
   * @param {number} userId - User ID
   */
  addParticipant(canvasId, userId) {
    const session = this.activeSessions.get(canvasId);
    if (session) {
      session.participants.add(userId);
    }
  }

  /**
   * Remove a participant from a live session
   * @param {string} canvasId - Canvas ID
   * @param {number} userId - User ID
   */
  removeParticipant(canvasId, userId) {
    const session = this.activeSessions.get(canvasId);
    if (session) {
      session.participants.delete(userId);
    }
  }

  /**
   * Check if a canvas has an active live session
   * @param {string} canvasId - Canvas ID
   * @returns {boolean}
   */
  isLive(canvasId) {
    return this.activeSessions.has(canvasId);
  }

  /**
   * Get session info
   * @param {string} canvasId - Canvas ID
   * @returns {Object|null} Session info or null
   */
  getSession(canvasId) {
    const session = this.activeSessions.get(canvasId);
    if (!session) {
      return null;
    }

    return {
      canvasId: session.canvasId,
      ownerId: session.ownerId,
      startedAt: session.startedAt,
      participantCount: session.participants.size,
    };
  }

  /**
   * Get all active sessions (for debugging/admin)
   * @returns {Array} Array of session info
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values()).map((session) => ({
      canvasId: session.canvasId,
      ownerId: session.ownerId,
      startedAt: session.startedAt,
      participantCount: session.participants.size,
    }));
  }
}

// Export singleton instance
export const liveSessionService = new LiveSessionService();
export default liveSessionService;
