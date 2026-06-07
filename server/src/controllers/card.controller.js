import Card from '../models/Card.js';
import Column from '../models/Column.js';
import Board from '../models/Board.js';

export const createCard = async (req, res, next) => {
  try {
    const { title, columnId, boardId } = req.body;

    // Verify board exists and belongs to user
    const board = await Board.findOne({ _id: boardId, owner: req.user.id });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // Get highest order in this column to append at the bottom
    const lastCard = await Card.findOne({ columnId }).sort('-order');
    const newOrder = lastCard ? lastCard.order + 1 : 0;

    const card = await Card.create({
      title,
      columnId,
      boardId,
      order: newOrder,
    });

    res.status(201).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

export const getCards = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    // Verify board ownership
    const board = await Board.findOne({ _id: boardId, owner: req.user.id });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // Fetch all cards for this board, sorted by order
    const cards = await Card.find({ boardId }).sort('order');

    res.json({ success: true, cards });
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req, res, next) => {
  try {
    const { title, description, columnId, order } = req.body;
    
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, columnId, order } },
      { new: true, runValidators: true }
    );

    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    res.json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    next(error);
  }
};
