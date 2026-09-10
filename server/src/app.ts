import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';
import { registerAudioSocketHandlers } from './websocket/audioStream.socket.js';
import { createOrderController, verifyPaymentController } from './controllers/subscription.controller.js';
import { optionalJWT } from './middlewares/auth.middleware.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware Stack
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

const allowedOrigins = [env.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'x-razorpay-signature', 'x-requested-with'],
    exposedHeaders: ['set-cookie'],
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Swagger OpenAPI Documentation Specs
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SpeakWise AI REST & WebSocket API Specification',
    version: '1.0.0',
    description: 'Enterprise API documentation for real-time speech coaching, low-latency live ASR, acoustic analytics, and LLM report generation.',
  },
  servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}` }],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Health Check Route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', service: 'SpeakWise AI Engine', timestamp: new Date().toISOString() });
});

// Direct Razorpay Standard Web Checkout Endpoints
app.post('/api/create-order', optionalJWT, createOrderController);
app.post('/api/verify-payment', optionalJWT, verifyPaymentController);

// Mount Main REST API Routes
app.use(env.API_PREFIX, apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Register Socket.IO Handlers
registerAudioSocketHandlers(io);

// Bootstrap Server & DB
const startServer = async () => {
  await connectDB();
  server.listen(env.PORT, () => {
    logger.info(`🚀 SpeakWise AI Backend running on http://localhost:${env.PORT}`);
    logger.info(`📚 Swagger API Docs available at http://localhost:${env.PORT}/api-docs`);
  });
};

startServer();

export default app;
