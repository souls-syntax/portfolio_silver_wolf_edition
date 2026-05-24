import mongoose from 'mongoose';
import 'dotenv/config';
import { BLOGS, SERIES } from '../src/data/blogs.js';

import Blog from '../api/models/Blog.js';
import Series from '../api/models/Series.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing
    await Blog.deleteMany({});
    await Series.deleteMany({});
    console.log('Cleared existing data.');

    // Insert Series
    if (SERIES.length > 0) {
      await Series.insertMany(SERIES);
      console.log(`Inserted ${SERIES.length} series.`);
    }

    // Insert Blogs
    if (BLOGS.length > 0) {
      await Blog.insertMany(BLOGS);
      console.log(`Inserted ${BLOGS.length} blogs.`);
    }

    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
