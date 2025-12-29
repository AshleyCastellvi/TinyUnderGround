import { Router } from 'express';
import {
    getCollaborations,
    createCollaboration,
    getCollaborationById,
    updateCollaboration,
    deleteCollaboration,
    getMessages,
    sendMessage,
    getConversations,
    getNotifications,
    markNotificationsRead,
    getCommunityStats
} from '../controllers/communityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/collabs', getCollaborations);
router.get('/collabs/:id', getCollaborationById);
router.get('/stats', getCommunityStats);

// Protected routes - Collaborations
router.post('/collabs', authenticateToken, createCollaboration);
router.put('/collabs/:id', authenticateToken, updateCollaboration);
router.delete('/collabs/:id', authenticateToken, deleteCollaboration);

// Protected routes - Messages
router.get('/conversations', authenticateToken, getConversations);
router.get('/messages/:userId', authenticateToken, getMessages);
router.post('/messages', authenticateToken, sendMessage);

// Protected routes - Notifications
router.get('/notifications', authenticateToken, getNotifications);
router.put('/notifications/read', authenticateToken, markNotificationsRead);

export default router;
