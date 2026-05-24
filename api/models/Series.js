import mongoose from 'mongoose';

const SeriesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] },
  chapterCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Series || mongoose.model('Series', SeriesSchema);
