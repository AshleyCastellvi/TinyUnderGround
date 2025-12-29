import { Router } from 'express';
import {
    getUserById,
    getUserTracks,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    searchUsers,
    getTopArtists
} from '../controllers/userController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/search', searchUsers);
router.get('/top', getTopArtists);
router.get('/:id', optionalAuth, getUserById);
router.get('/:id/tracks', optionalAuth, getUserTracks);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

// Protected routes
router.post('/:id/follow', authenticateToken, followUser);
router.delete('/:id/follow', authenticateToken, unfollowUser);

export default router;
