import logger from '../../config/logger.js';
import { findCanvasById } from './findCanvasById.js';
import liveSessionService from '../../services/liveSessionService.js';

/**
 * Start a live session for a canvas
 * Only the canvas owner can start a live session
 */
export const startLiveSession = async (canvasId, userId) => {
  try {
    // Verify canvas exists
    const canvas = await findCanvasById(canvasId);
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Verify user is the owner
    if (canvas.owner_id !== userId) {
      throw new Error('Only the canvas owner can start a live session');
    }

    // Start the session
    const session = liveSessionService.startSession(canvasId, userId);

    logger.info(`Live session started for canvas ${canvasId} by user ${userId}`);

    return {
      success: true,
      session: {
        canvasId: session.canvasId,
        ownerId: session.ownerId,
        startedAt: session.startedAt,
        participantCount: session.participants.size,
      },
    };
  } catch (error) {
    logger.error(error, `Error starting live session for canvas ${canvasId}`);
    throw error;
  }
};

/**
 * Stop a live session for a canvas
 * Only the canvas owner can stop a live session
 */
export const stopLiveSession = async (canvasId, userId) => {
  try {
    // Verify canvas exists
    const canvas = await findCanvasById(canvasId);
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Stop the session (service will verify ownership)
    const stopped = liveSessionService.stopSession(canvasId, userId);

    if (!stopped) {
      throw new Error('No active live session found for this canvas');
    }

    logger.info(`Live session stopped for canvas ${canvasId} by user ${userId}`);

    return {
      success: true,
      message: 'Live session stopped successfully',
    };
  } catch (error) {
    logger.error(error, `Error stopping live session for canvas ${canvasId}`);
    throw error;
  }
};

/**
 * Get live session status for a canvas
 */
export const getLiveSessionStatus = async (canvasId, userId) => {
  try {
    // Verify canvas exists and user has access
    const canvas = await findCanvasById(canvasId);
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Check if user has access
    const isOwner = canvas.owner_id === userId;
    const isShared = canvas.shared_with_ids && canvas.shared_with_ids.includes(userId);

    if (!isOwner && !isShared) {
      throw new Error('You do not have access to this canvas');
    }

    // Get session status
    const isLive = liveSessionService.isLive(canvasId);
    const session = liveSessionService.getSession(canvasId);

    return {
      isLive,
      session: session || null,
    };
  } catch (error) {
    logger.error(error, `Error getting live session status for canvas ${canvasId}`);
    throw error;
  }
};
