import { createClient } from 'redis';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const Client = createClient({
  url: process.env.REDIS_URL,
});
