import { Router } from 'express';
import {
    createTrack,
    getTracks,
    getTrackById,
    updateTrack,
    deleteTrack,
    likeTrack,
    unlikeTrack,
    getComments,
    addComment,
    streamAudio,
    getTrendingTracks
} from '../controllers/trackController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadTrack } from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, getTracks);
router.get('/trending', optionalAuth, getTrendingTracks);
router.get('/:id', optionalAuth, getTrackById);
router.get('/:id/comments', getComments);
router.get('/:id/stream', streamAudio);

// Protected routes
router.post('/', authenticateToken, uploadTrack.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), createTrack);
router.put('/:id', authenticateToken, updateTrack);
router.delete('/:id', authenticateToken, deleteTrack);
router.post('/:id/like', authenticateToken, likeTrack);
router.delete('/:id/like', authenticateToken, unlikeTrack);
router.post('/:id/comments', authenticateToken, addComment);

export default router;
