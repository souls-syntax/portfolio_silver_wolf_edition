import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  tags: { type: [String], default: [] },
  seriesId: { type: String, default: null },
  chapterIndex: { type: Number, default: null },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
