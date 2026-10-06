import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:4000'),
  WEB_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgrespassword@localhost:5432/kuripp_dev?schema=public'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/kuripp_dev'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().default('kuripp_dev_jwt_secret_min_32_characters_long_12345'),
  JWT_REFRESH_SECRET: z.string().default('kuripp_dev_refresh_secret_min_32_characters_long_12345'),
  COOKIE_SECRET: z.string().default('kuripp_dev_cookie_secret_min_32_characters_long_12345'),

  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_DEFAULT_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),

  AI_SERVICE_URL: z.string().default('http://localhost:8000'),

  ALERT_WHATSAPP_NUMBER: z.string().default(''),
  WHATSAPP_API_URL: z.string().default('http://localhost:8080'),
  WHATSAPP_API_KEY: z.string().default(''),

  S3_ENDPOINT: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('kuripp-documents'),
  S3_REGION: z.string().default('auto'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  EMAIL_HOST: z.string().default('localhost'),
  EMAIL_PORT: z.coerce.number().default(1025),
  EMAIL_SECURE: z.coerce.boolean().default(false),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('"KURIPP System" <no-reply@kuripp.local>'),
});

export const env = envSchema.parse(process.env);
