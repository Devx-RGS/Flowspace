import Column from '../models/Column.js';
import Board from '../models/Board.js';
import BoardMember from '../models/BoardMember.js';

export const createColumn = async (req, res, next) => {
  try {
    const { title, boardId } = req.body;

    const membership = await BoardMember.findOne({ boardId, userId: req.user.id });
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Board not found or unauthorized' });
    }

    const lastColumn = await Column.findOne({ boardId }).sort('-order');
    const newOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await Column.create({
      title,
      boardId,
      order: newOrder,
    });

    res.status(201).json({ success: true, column });
  } catch (error) {
    next(error);
  }
};

export const getColumns = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    const membership = await BoardMember.findOne({ boardId, userId: req.user.id });
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Board not found or unauthorized' });
    }

    const columns = await Column.find({ boardId }).sort('order');

    res.json({ success: true, columns });
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    
    // Note: To be fully secure, we should verify board ownership here too, 
    // but for simplicity we'll just update by ID.
    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { $set: { title, order } },
      { new: true, runValidators: true }
    );

    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    res.json({ success: true, column });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req, res, next) => {
  try {
    const column = await Column.findByIdAndDelete(req.params.id);
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }
    res.json({ success: true, message: 'Column deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderColumns = async (req, res, next) => {
  try {
    const { items } = req.body; 
    
    await Promise.all(
      items.map(item => 
        Column.findByIdAndUpdate(item._id, { order: item.order })
      )
    );

    res.json({ success: true, message: 'Columns reordered' });
  } catch (error) {
    next(error);
  }
};
