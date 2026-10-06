import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createYoga } from 'graphql-yoga';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { logger } from './lib/logger';
import { schema } from './graphql/schema';
import { createDataLoaders } from './lib/dataloaders';
import { redis } from './lib/redis';
import { connectMongoDB } from './lib/mongodb';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Security Middleware
  app.use(
    cors({
      origin: [env.WEB_URL, 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '10mb' }));

  // Initialize GraphQL Yoga v5
  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    graphiql: env.NODE_ENV !== 'production',
    maskedErrors: env.NODE_ENV === 'production',
    context: async ({ request }) => {
      return {
        loaders: createDataLoaders(),
        req: request,
      };
    },
  });

  // Mount GraphQL Yoga strictly at /graphql
  app.use('/graphql', yoga);

  // Attach Socket.IO for Realtime Communication
  const io = new SocketIOServer(server, {
    cors: {
      origin: [env.WEB_URL, 'http://localhost:3000'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('join:workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      logger.debug(`Socket ${socket.id} joined workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  // Connect to databases asynchronously
  try {
    await redis.connect().catch(() => {
      logger.warn('Redis not currently reachable. Will retry.');
    });
  } catch {
    // Redis connection warning logged
  }

  await connectMongoDB();

  // Start HTTP Server
  server.listen(env.PORT, () => {
    logger.info(`====================================================`);
    logger.info(`KURIPP GraphQL API Server started on port ${env.PORT}`);
    logger.info(`GraphQL Endpoint: http://localhost:${env.PORT}/graphql`);
    logger.info(`Environment:      ${env.NODE_ENV}`);
    logger.info(`====================================================`);
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error:', { error: err });
  process.exit(1);
});
