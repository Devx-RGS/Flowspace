import express from 'express';
import {
  signup,
  login,
  logout,
  getMe,
} from '../controllers/auth.controller.js';
import { signupRules, loginRules, validate } from '../validators/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

export default router;
