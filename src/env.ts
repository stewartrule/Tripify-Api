import z from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().startsWith('postgres').url(),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
