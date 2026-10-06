import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from './logger';

export async function connectMongoDB(): Promise<boolean> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    logger.info('Connected to MongoDB');
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn('MongoDB connection deferred / offline:', { error: errorMsg });
    return false;
  }
}
