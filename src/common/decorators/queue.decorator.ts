import { SetMetadata } from '@nestjs/common';

export const QUEUE_DECORATOR_KEY = 'queue_metadata';

export interface QueueMetadata {
  name: string;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

export const QueueConfig = (metadata: QueueMetadata) => SetMetadata(QUEUE_DECORATOR_KEY, metadata);
