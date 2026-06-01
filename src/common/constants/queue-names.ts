// src/common/constants/queue-names.ts
export const QueueNames = {
  // Main processing queues
  BATCH_PROCESSING: 'batch-processing',
  CONTACT_PROCESSING: 'contact-processing',
  COMPANY_PROCESSING: 'company-processing',
  DEAL_PROCESSING: 'deal-processing',

  // Engagement queues
  EMAIL_PROCESSING: 'email-processing',
  CALL_PROCESSING: 'call-processing',
  MEETING_PROCESSING: 'meeting-processing',
  TASK_PROCESSING: 'task-processing',
  NOTE_PROCESSING: 'note-processing',

  // Association queue
  ASSOCIATION_PROCESSING: 'association-processing',

  // Tracking queue
  TRACKING_QUEUE: 'tracking-queue',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];
