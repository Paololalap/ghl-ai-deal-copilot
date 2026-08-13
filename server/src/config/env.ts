import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  ghl: {
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    apiVersion: '2021-07-28',
    apiKey: process.env.GHL_API_KEY || '',
    locationId: process.env.GHL_LOCATION_ID || '',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    useMock: process.env.USE_MOCK_AI === 'true',
  },
  mockGHL: process.env.USE_MOCK_GHL === 'true',
};
