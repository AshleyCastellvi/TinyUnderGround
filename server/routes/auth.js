import { Router } from 'express';
import { register, login, getMe, updateMe, updateAvatar } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/me/avatar', authenticateToken, uploadImage.single('avatar'), updateAvatar);

export default router;
