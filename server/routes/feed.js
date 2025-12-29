import { Router } from 'express';
import {
    getFeed,
    getRecentTracks,
    getPopularTracks,
    getSuggestions
} from '../controllers/feedController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/recent', optionalAuth, getRecentTracks);
router.get('/popular', optionalAuth, getPopularTracks);
router.get('/suggestions', optionalAuth, getSuggestions);

// Protected routes
router.get('/', authenticateToken, getFeed);

export default router;
