import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { loadEnv } from './config/loadEnv';
import { registerRoutes } from './app/registerRoutes';

const appConfig = loadEnv();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = appConfig.PORT;
const MONGO_URI = appConfig.MONGO_URI;

// MongoDB接続 (Req_5.1)
mongoose.connect(MONGO_URI)
  .then(() => console.log(`✅ MongoDB connected (${appConfig.APP_ENV})`))
  .catch(err => console.error('❌ Connection error:', err));

// ヘルスチェック (Req_11.1)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
