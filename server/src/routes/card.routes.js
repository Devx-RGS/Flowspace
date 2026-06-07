import express from 'express';
import {
  createCard,
  getCards,
  updateCard,
  deleteCard,
  reorderCards,
} from '../controllers/card.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get all cards for a specific board
router.get('/board/:boardId', getCards);

// Create a new card
router.post('/', createCard);

// Reorder cards
router.put('/reorder', reorderCards);

// Update or delete a card
router.route('/:id')
  .put(updateCard)
  .delete(deleteCard);

export default router;
