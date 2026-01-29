import z from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.url().startsWith('postgres'),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
