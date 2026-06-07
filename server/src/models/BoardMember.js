import mongoose from 'mongoose';

const boardMemberSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A user can only be added to a board once
boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });

const BoardMember = mongoose.model('BoardMember', boardMemberSchema);

export default BoardMember;
