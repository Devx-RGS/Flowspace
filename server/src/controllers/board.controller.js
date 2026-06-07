import Board from '../models/Board.js';

export const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const board = await Board.create({
      title,
      description,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      board,
    });
  } catch (error) {
    next(error);
  }
};

export const getBoards = async (req, res, next) => {
  try {
    // Only fetch boards owned by the logged-in user
    const boards = await Board.find({ owner: req.user.id }).sort('-createdAt');

    res.json({
      success: true,
      boards,
    });
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found or unauthorized',
      });
    }

    res.json({
      success: true,
      board,
    });
  } catch (error) {
    next(error);
  }
};
