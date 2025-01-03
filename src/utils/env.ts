import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  DB_HOST: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  PORT: z.string().optional().default('3000'),
  DB_PORT: z.string(),
  DB_URL: z.string()
});

const env = EnvSchema.parse(process.env);

export default env;
