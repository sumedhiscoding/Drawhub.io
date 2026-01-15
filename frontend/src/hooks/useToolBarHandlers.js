import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CanvasActionsContext } from '../store/Context/CanvasActionContext';

/**
 * Production-grade custom hook for managing canvas sharing functionality
 * Handles email management, sharing, user access, and live status
 *
 * @param {string} canvasId - The ID of the canvas to share
 * @returns {Object} Object containing all sharing-related state and functions
 */
export const useToolBarHandlers = (canvasId) => {
  // Email management state
  const [emails, setEmails] = useState([{ id: Date.now(), value: '' }]);
  const [loading, setLoading] = useState(false);

  // Shared users state
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [removingAccess, setRemovingAccess] = useState(null);

  const { connectionState, isInRoom, joinCanvasRoom, leaveCanvasRoom } =
    useContext(CanvasActionsContext);

  const isLive = connectionState === 'connected' && isInRoom;

  // Input refs for email fields
  const inputRefs = useRef({});

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email is valid
   */
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  /**
   * Adds a new email input field
   */
  const addEmailField = useCallback(() => {
    setEmails((prev) => [...prev, { id: Date.now(), value: '' }]);
  }, []);

  /**
   * Removes an email input field
   * @param {number} id - ID of the email field to remove
   */
  const removeEmailField = useCallback((id) => {
    setEmails((prev) => {
      if (prev.length > 1) {
        delete inputRefs.current[id];
        return prev.filter((email) => email.id !== id);
      }
      return prev;
    });
  }, []);

  /**
   * Updates an email field value
   * @param {number} id - ID of the email field
   * @param {string} value - New email value
   */
  const updateEmail = useCallback((id, value) => {
    setEmails((prev) => prev.map((email) => (email.id === id ? { ...email, value } : email)));
  }, []);

  /**
   * Fetches the list of users who have access to the canvas
   */
  const fetchSharedUsers = useCallback(async () => {
    if (!canvasId) return;

    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/canvas/shared-users/${canvasId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSharedUsers(response.data.sharedUsers || []);
    } catch (error) {
      // Don't show error for 403 (forbidden) - user might not have permission
      if (error.response?.status !== 403) {
        console.error('Error fetching shared users:', error);
        // Only show toast for unexpected errors
        if (error.response?.status !== 404) {
          toast.error('Failed to load shared users');
        }
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [canvasId]);

  /**
   * Checks the live status of the canvas
   * Note: Live status is now determined by socket connection and room membership
   * This function is kept for potential future use but currently not needed
   */
  const checkLiveStatus = useCallback(async () => {
    // Live status is now managed through socket events (canvas:joined, canvas:owner-joined)
    // No need to check via API endpoint
    // This function is kept for potential future implementation
  }, []);

  /**
   * Shares the canvas with the provided email addresses
   */
  const handleShare = useCallback(async () => {
    // Validate all emails
    const validEmails = emails
      .map((email) => email.value.trim())
      .filter((email) => email.length > 0);

    if (validEmails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }

    // Check for invalid emails
    const invalidEmails = validEmails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    // Check for duplicates
    const uniqueEmails = [...new Set(validEmails)];
    if (uniqueEmails.length !== validEmails.length) {
      toast.error('Please remove duplicate email addresses');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      // Share with all emails
      const sharePromises = uniqueEmails.map((email) =>
        axios.post(
          `${import.meta.env.VITE_API_URL}/canvas/share/${canvasId}`,
          { email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      await Promise.all(sharePromises);
      toast.success(`Canvas shared with ${uniqueEmails.length} user(s)`);

      // Reset emails to single empty field
      setEmails([{ id: Date.now(), value: '' }]);

      // Refresh shared users list
      await fetchSharedUsers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to share canvas. Please try again.';
      toast.error(errorMessage);
      console.error('Error sharing canvas:', error);
    } finally {
      setLoading(false);
    }
  }, [emails, canvasId, validateEmail, fetchSharedUsers]);

  /**
   * Removes access for a specific user
   * @param {string} userId - ID of the user to remove access for
   */
  const handleRemoveAccess = useCallback(
    async (userId) => {
      if (!window.confirm('Are you sure you want to remove access for this user?')) {
        return;
      }

      setRemovingAccess(userId);
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          toast.error('Authentication required. Please log in again.');
          return;
        }

        await axios.delete(`${import.meta.env.VITE_API_URL}/canvas/remove-access/${canvasId}`, {
          data: { userId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success('Access removed successfully');

        // Refresh shared users list
        await fetchSharedUsers();
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to remove access. Please try again.';
        toast.error(errorMessage);
        console.error('Error removing access:', error);
      } finally {
        setRemovingAccess(null);
      }
    },
    [canvasId, fetchSharedUsers],
  );

  /**
   * Toggles the live status of the canvas
   * Emits canvas:join event to join the canvas room
   */
  const handleGoLive = useCallback(async () => {
    if (!canvasId) {
      toast.error('Canvas not available');
      return;
    }

    if (isLive) {
      leaveCanvasRoom(canvasId);
      return;
    }

    joinCanvasRoom(canvasId);
  }, [canvasId, isLive, joinCanvasRoom, leaveCanvasRoom]);

  // Fetch shared users on mount and when canvasId changes
  useEffect(() => {
    if (canvasId) {
      fetchSharedUsers();
      // Live status is now managed through socket events, no need to check via API
    }
  }, [canvasId, fetchSharedUsers]);

  return {
    // Email management
    emails,
    addEmailField,
    removeEmailField,
    updateEmail,
    validateEmail,
    inputRefs,

    // Sharing functionality
    handleShare,
    loading,

    // Shared users
    sharedUsers,
    loadingUsers,
    fetchSharedUsers,
    handleRemoveAccess,
    removingAccess,

    // Live status
    isLive,
    connectionState,
    checkLiveStatus,
    handleGoLive,
  };
};

export default useToolBarHandlers;
