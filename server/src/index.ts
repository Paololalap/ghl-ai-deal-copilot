import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRoutes from './routes/apiRoutes';

const app = express();

app.use(cors());
app.use(express.json());

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

app.listen(config.port, () => {
  console.log(`🚀 [GHL AI Copilot Engine] Running on port ${config.port}`);
  console.log(`📡 Webhook listener active at http://localhost:${config.port}/api/webhook/ghl`);
  console.log(`📊 API Pipeline endpoint: http://localhost:${config.port}/api/pipeline`);
});
