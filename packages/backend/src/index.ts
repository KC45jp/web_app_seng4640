import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { loadEnv } from './config/loadEnv';
import { registerHealthRoutes } from './app/health';
import { registerRoutes } from './app/registerRoutes';
import { logger } from './utils/logger';
import { requestContext } from './middlewares/requestContext';

const appConfig = loadEnv();

const app = express();
app.use(cors());
app.use(requestContext);
app.use(express.json());

const PORT = appConfig.PORT;
const MONGO_URI = appConfig.MONGO_URI;
const MONGO_MAX_POOL_SIZE = appConfig.MONGO_MAX_POOL_SIZE;

const mongooseConnectOptions =
  MONGO_MAX_POOL_SIZE === undefined
    ? undefined
    : { maxPoolSize: MONGO_MAX_POOL_SIZE };

// MongoDB connection (Req_5.1)
mongoose.connect(MONGO_URI, mongooseConnectOptions)
  .then(() => {
    logger.info(
      {
        appEnv: appConfig.APP_ENV,
        mongoMaxPoolSize: MONGO_MAX_POOL_SIZE,
      },
      "MongoDB connected"
    );
  })
  .catch((err) => {
    logger.error(
      { err, mongoMaxPoolSize: MONGO_MAX_POOL_SIZE },
      "MongoDB connection failed"
    );
  });

registerHealthRoutes(app, {
  appEnv: appConfig.APP_ENV,
  mongoUri: appConfig.MONGO_URI,
});
registerRoutes(app);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});
