import express from 'express';
import {
  createBoard,
  getBoards,
  getBoardById,
  joinBoardWithCode,
} from '../controllers/board.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All board routes require authentication
router.use(auth);

router.route('/')
  .get(getBoards)
  .post(createBoard);

router.route('/:id')
  .get(getBoardById);

router.route('/join/:code')
  .post(joinBoardWithCode);

export default router;
