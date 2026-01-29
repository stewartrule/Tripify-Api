import { createConfig } from 'express-zod-api';
import { logger } from './logger.js';

export const config = createConfig({
  http: {
    listen: 8090,
  },
  cors: true,
  logger,
  startupLogo: false,
});
