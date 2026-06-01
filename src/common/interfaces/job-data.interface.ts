export interface BaseJobData {
  batchId: string;
  sourceId: string;
  timestamp: string;
  retryCount?: number;
}

export interface ContactJobData extends BaseJobData {
  entityType: 'contact';
  sourceData: any;
  mappings: any;
}

export interface CompanyJobData extends BaseJobData {
  entityType: 'company';
  sourceData: any;
  mappings: any;
}

export interface DealJobData extends BaseJobData {
  entityType: 'deal';
  sourceData: any;
  mappings: any;
}

export interface EmailJobData extends BaseJobData {
  emailId: string;
  properties: any;
  sourceData: any;
}

export interface CallJobData extends BaseJobData {
  callId: string;
  properties: any;
  sourceData: any;
}

export interface MeetingJobData extends BaseJobData {
  meetingId: string;
  properties: any;
  sourceData: any;
}

export interface TaskJobData extends BaseJobData {
  taskId: string;
  properties: any;
  sourceData: any;
}

export interface NoteJobData extends BaseJobData {
  noteId: string;
  properties: any;
  sourceData: any;
}

export interface AssociationJobData extends BaseJobData {
  fromSourceId: string;
  fromEntityType: string;
  toSourceId: string;
  toEntityType: string;
  associationType: string;
}

export type JobData = ContactJobData | CompanyJobData | DealJobData | EmailJobData | CallJobData | MeetingJobData | TaskJobData | NoteJobData | AssociationJobData;
