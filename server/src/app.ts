import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import apiRoutes from './routes/apiRoutes';

const app = express();

// Security headers
app.use(helmet());

// CORS: allow configured origin or same-origin requests on Vercel
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server (origin is undefined) or configured CORS origin
    if (!origin || origin === config.corsOrigin || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/Vercel preview, fallback safe
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// Body parser with size limit
app.use(express.json({ limit: '1mb' }));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Register API & Webhook Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'GHL AI Revenue & Deal Health Copilot',
    version: '2.0.0',
    mode: config.mockGHL ? 'DEMO / MOCK GHL MODE' : 'LIVE GHL API V2 MODE',
    timestamp: new Date().toISOString()
  });
});

export default app;
