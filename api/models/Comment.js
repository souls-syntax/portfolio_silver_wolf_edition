import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  postId: { type: String, required: true },
  parentId: { type: String, default: null },
  author: { type: String, required: true },
  colorHue: { type: Number, required: true },
  body: { type: String, required: true },
  timestamp: { type: Number, required: true },
  reactions: { type: Map, of: Number, default: {} },
}, { timestamps: true });

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
