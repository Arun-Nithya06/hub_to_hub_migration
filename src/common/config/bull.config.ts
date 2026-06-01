import { BullRootModuleOptions } from '@nestjs/bullmq';
import { redisConfig } from './redis.config';

export const bullConfig: BullRootModuleOptions = {
  connection: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
  },
};
