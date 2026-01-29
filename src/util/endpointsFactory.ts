import { db } from '../db/index.js';
import { defaultEndpointsFactory } from 'express-zod-api';

export const publicEndpointsFactory = defaultEndpointsFactory.addContext(
  async () => ({
    db,
  })
);
