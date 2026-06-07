import express from 'express';
import {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
} from '../controllers/column.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get columns for a specific board
router.get('/board/:boardId', getColumns);

// Create a new column
router.post('/', createColumn);

// Update (rename/reorder) or delete a column
router.route('/:id')
  .put(updateColumn)
  .delete(deleteColumn);

export default router;
