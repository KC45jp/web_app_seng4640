import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { loadEnv } from './config/loadEnv';
import { registerRoutes } from './app/registerRoutes';

const appEnv = loadEnv();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/seng4640';

// MongoDB接続 (Req_5.1)
mongoose.connect(MONGO_URI)
  .then(() => console.log(`✅ MongoDB connected (${appEnv})`))
  .catch(err => console.error('❌ Connection error:', err));

// ヘルスチェック (Req_11.1)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
