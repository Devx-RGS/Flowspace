import crypto from 'crypto';
import Board from '../models/Board.js';
import BoardMember from '../models/BoardMember.js';

const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex');
};

export const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const board = await Board.create({
      title,
      description,
      inviteCode: generateInviteCode(),
    });

    await BoardMember.create({
      boardId: board._id,
      userId: req.user.id,
      role: 'owner',
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
    const memberships = await BoardMember.find({ userId: req.user.id });
    const boardIds = memberships.map((m) => m.boardId);

    const boards = await Board.find({ _id: { $in: boardIds } }).sort('-createdAt');

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
    const membership = await BoardMember.findOne({
      boardId: req.params.id,
      userId: req.user.id,
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Board not found or unauthorized',
      });
    }

    const board = await Board.findById(req.params.id);

    res.json({
      success: true,
      board,
      role: membership.role,
    });
  } catch (error) {
    next(error);
  }
};

export const joinBoardWithCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const board = await Board.findOne({ inviteCode: code });
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code or board not found',
      });
    }

    const existingMember = await BoardMember.findOne({
      boardId: board._id,
      userId: req.user.id,
    });

    if (existingMember) {
      return res.status(200).json({
        success: true,
        message: 'Already a member',
        boardId: board._id,
      });
    }

    await BoardMember.create({
      boardId: board._id,
      userId: req.user.id,
      role: 'member',
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the board',
      boardId: board._id,
    });
  } catch (error) {
    next(error);
  }
};
