import { db } from '../db';
import { defaultEndpointsFactory } from 'express-zod-api';

export const publicEndpointsFactory = defaultEndpointsFactory.addOptions(
  async () => ({
    db,
  })
);
