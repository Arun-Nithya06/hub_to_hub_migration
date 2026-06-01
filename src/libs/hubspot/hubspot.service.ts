import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@hubspot/api-client';
import PQueue from 'p-queue';
import {
  AssociationSpec,
  BatchResponseSimplePublicObject,
  SimplePublicObject,
  CollectionResponseSimplePublicObjectWithAssociationsForwardPaging,
  BatchResponseSimplePublicObjectWithErrors,
  Filter,
  CollectionResponseWithTotalSimplePublicObjectForwardPaging,
  FilterOperatorEnum,
} from '@hubspot/api-client/lib/codegen/crm/objects';
import { PublicOwner } from '@hubspot/api-client/lib/codegen/crm/owners';
import { HubspotAccount, HubspotObject } from './hubspot.enums';
import {
  CollectionResponseMultiAssociatedObjectWithLabelForwardPaging,
  LabelsBetweenObjectPair,
  MultiAssociatedObjectWithLabel,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4';
import { Property } from '@hubspot/api-client/lib/codegen/crm/properties/models/Property';

interface QueueStats {
  pending: number;
  size: number;
  concurrency: number;
}

interface AccountStatus {
  account: HubspotAccount;
  configured: boolean;
  status: string;
  apiKeyPrefix?: string;
}

@Injectable()
export class HubspotService implements OnApplicationShutdown {
  private readonly logger = new Logger(HubspotService.name);
  private clients: Map<HubspotAccount, Client> = new Map();
  private queue: PQueue;
  private isSourceConfigured: boolean = false;
  private isDestinationConfigured: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000;

  constructor(private configService: ConfigService) {
    this.initializeClients();
    this.initializeQueue();
    this.logStartupStatus();
  }

  private initializeClients(): void {
    const sourceToken = this.configService.get<string>('HUBSPOT_SOURCE_API_KEY');
    if (sourceToken) {
      this.clients.set(HubspotAccount.SOURCE, new Client({ accessToken: sourceToken }));
      this.isSourceConfigured = true;
    }

    const destToken = this.configService.get<string>('HUBSPOT_DESTINATION_API_KEY');
    if (destToken) {
      this.clients.set(HubspotAccount.DESTINATION, new Client({ accessToken: destToken }));
      this.isDestinationConfigured = true;
    }
  }

  private initializeQueue(): void {
    const concurrency = parseInt(this.configService.get<string>('HUBSPOT_QUEUE_CONCURRENCY', '3'), 10);
    const interval = parseInt(this.configService.get<string>('HUBSPOT_QUEUE_INTERVAL', '1000'), 10);
    const intervalCap = parseInt(this.configService.get<string>('HUBSPOT_QUEUE_INTERVAL_CAP', '10'), 10);
    const timeout = parseInt(this.configService.get<string>('HUBSPOT_QUEUE_TIMEOUT', '30000'), 10);

    this.queue = new PQueue({
      concurrency: isNaN(concurrency) ? 3 : concurrency,
      interval: isNaN(interval) ? 1000 : interval,
      intervalCap: isNaN(intervalCap) ? 10 : intervalCap,
      timeout: isNaN(timeout) ? 30000 : timeout,
    });

    this.setupQueueListeners();
  }

  private logStartupStatus(): void {
    this.logger.log('HubSpot Service Initialized');

    if (this.isSourceConfigured) {
      this.logger.log('Source HubSpot account configured');
    } else {
      this.logger.warn('Source HubSpot account NOT configured (missing HUBSPOT_SOURCE_API_KEY)');
    }

    if (this.isDestinationConfigured) {
      this.logger.log('Destination HubSpot account configured');
    } else {
      this.logger.warn('Destination HubSpot account NOT configured (missing HUBSPOT_DESTINATION_API_KEY)');
    }
  }

  private setupQueueListeners(): void {
    this.queue.on('active', () => {
      this.logger.debug(`Queue Status - Active: ${this.queue.pending}, Pending: ${this.queue.size}`);
    });

    this.queue.on('idle', () => {
      this.logger.debug('Queue is idle');
    });

    this.queue.on('error', (error) => {
      this.logger.error(`Queue error: ${error.message}`, error.stack);
    });
  }

  private getClient(account: HubspotAccount): Client {
    const client = this.clients.get(account);
    if (!client) {
      const errorMsg = `${account} HubSpot account not configured. Please check your .env file`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    return client;
  }

  private async execute<T>(account: HubspotAccount, operation: () => Promise<T>, operationName: string, retryCount: number = 0): Promise<T> {
    return await this.queue.add(async () => {
      const start = Date.now();
      try {
        this.logger.debug(`[${account}] ${operationName} - Started`);
        const result = await this.withRetry(operation, retryCount);
        const duration = Date.now() - start;
        this.logger.debug(`[${account}] ${operationName} - Completed (${duration}ms)`);
        return result;
      } catch (error: any) {
        const duration = Date.now() - start;
        this.logger.error(`[${account}] ${operationName} - Failed (${duration}ms): ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  private async withRetry<T>(operation: () => Promise<T>, retryCount: number = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isRetryable = this.isRetryableError(error);

      if (isRetryable && retryCount < this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        this.logger.warn(`Retry ${retryCount + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`);
        await this.sleep(delay);
        return this.withRetry(operation, retryCount + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.statusCode) || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getById(account: HubspotAccount, objectType: HubspotObject, id: string, properties?: string[]): Promise<SimplePublicObject> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.objects.basicApi.getById(objectType, id, properties);
      },
      `getById(${objectType}, ${id})`,
    );
  }

  async getList(
    account: HubspotAccount,
    objectType: HubspotObject,
    limit: number = 100,
    after?: string,
    properties?: string[],
  ): Promise<CollectionResponseSimplePublicObjectWithAssociationsForwardPaging> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.objects.basicApi.getPage(objectType, limit, after, properties);
      },
      `getList(${objectType}, limit=${limit})`,
    );
  }

  async getAll(account: HubspotAccount, objectType: HubspotObject, properties?: string[]): Promise<SimplePublicObject[]> {
    const allItems: SimplePublicObject[] = [];
    let after: string | undefined;

    while (true) {
      const response = await this.getList(account, objectType, 100, after, properties);

      if (response.results?.length) {
        allItems.push(...response.results);
      }

      after = response.paging?.next?.after;
      if (!after) break;
    }

    this.logger.log(`[${account}] Fetched ${allItems.length} ${objectType}`);
    return allItems;
  }

  async create(account: HubspotAccount, objectType: HubspotObject, properties: Record<string, any>): Promise<SimplePublicObject> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const result = await client.crm.objects.basicApi.create(objectType, { properties });
        this.logger.log(`[${account}] Created ${objectType} (ID: ${result.id})`);
        return result;
      },
      `create(${objectType})`,
    );
  }

  async update(account: HubspotAccount, objectType: HubspotObject, id: string, properties: Record<string, any>): Promise<SimplePublicObject> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.objects.basicApi.update(objectType, id, { properties });
      },
      `update(${objectType}, ${id})`,
    );
  }

  async delete(account: HubspotAccount, objectType: HubspotObject, id: string): Promise<void> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        await client.crm.objects.basicApi.archive(objectType, id);
        this.logger.log(`[${account}] Deleted ${objectType} (ID: ${id})`);
      },
      `delete(${objectType}, ${id})`,
    );
  }

  async upsert(account: HubspotAccount, objectType: HubspotObject, id: string, properties: Record<string, any>): Promise<SimplePublicObject> {
    try {
      return await this.update(account, objectType, id, properties);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return await this.create(account, objectType, properties);
      }
      throw error;
    }
  }

  async batchCreate(
    account: HubspotAccount,
    objectType: HubspotObject,
    objects: Array<{ properties: Record<string, any> }>,
  ): Promise<BatchResponseSimplePublicObject | BatchResponseSimplePublicObjectWithErrors> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const result = await client.crm.objects.batchApi.create(objectType, { inputs: objects });
        this.logger.log(`[${account}] Batch created ${result.results?.length || 0} ${objectType}`);
        return result;
      },
      `batchCreate(${objectType}, ${objects.length} items)`,
    );
  }

  async batchRead(
    account: HubspotAccount,
    objectType: HubspotObject,
    ids: string[],
    properties?: string[],
  ): Promise<BatchResponseSimplePublicObject | BatchResponseSimplePublicObjectWithErrors> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.objects.batchApi.read(objectType, {
          inputs: ids.map((id) => ({ id })),
          properties: [...new Set(properties || [])],
          propertiesWithHistory: [],
        });
      },
      `batchRead(${objectType}, ${ids.length} ids)`,
    );
  }

  async batchUpdate(
    account: HubspotAccount,
    objectType: HubspotObject,
    objects: Array<{ id: string; properties: Record<string, any> }>,
  ): Promise<BatchResponseSimplePublicObject | BatchResponseSimplePublicObjectWithErrors> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const result = await client.crm.objects.batchApi.update(objectType, {
          inputs: objects.map((obj) => ({ id: obj.id, properties: obj.properties })),
        });
        this.logger.log(`[${account}] Batch updated ${result.results?.length || 0} ${objectType}`);
        return result;
      },
      `batchUpdate(${objectType}, ${objects.length} items)`,
    );
  }

  async getAllProperties(account: HubspotAccount, objectType: HubspotObject, archived: boolean = false): Promise<Property[]> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const response = await client.crm.properties.coreApi.getAll(objectType, archived);

        const properties = response.results || [];
        this.logger.log(`[${account}] Fetched ${properties.length} properties for ${objectType}`);
        return properties;
      },
      `getAllProperties(${objectType})`,
    );
  }

  async search(
    account: HubspotAccount,
    objectType: HubspotObject,
    filters: Filter[],
    limit: number = 100,
    after?: string,
  ): Promise<CollectionResponseWithTotalSimplePublicObjectForwardPaging> {
    const searchRequest: any = {
      filterGroups: [{ filters }],
      limit: Math.min(limit, 100),
    };

    if (after) searchRequest.after = after;

    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.objects.searchApi.doSearch(objectType, searchRequest);
      },
      `search(${objectType})`,
    );
  }

  async searchByProperty(
    account: HubspotAccount,
    objectType: HubspotObject,
    propertyName: string,
    value: string,
    options?: {
      operator?: FilterOperatorEnum;
    },
  ): Promise<CollectionResponseWithTotalSimplePublicObjectForwardPaging> {
    const filters: Filter[] = [
      {
        propertyName: propertyName,
        operator: options?.operator as FilterOperatorEnum,
        value: value,
      },
    ];

    return this.search(account, objectType, filters);
  }

  async getAssociations(account: HubspotAccount, fromObjectType: HubspotObject, fromObjectId: string, toObjectType: HubspotObject): Promise<MultiAssociatedObjectWithLabel[]> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const allAssociations: MultiAssociatedObjectWithLabel[] = [];
        let after: string | undefined;

        do {
          const response = (await client.crm.associations.v4.basicApi.getPage(
            fromObjectType,
            fromObjectId,
            toObjectType,
            after,
            100,
          )) as CollectionResponseMultiAssociatedObjectWithLabelForwardPaging;

          allAssociations.push(...(response.results || []));
          after = response.paging?.next?.after;
        } while (after);

        return allAssociations;
      },
      `getAssociations(${fromObjectId} -> ${toObjectType})`,
    );
  }

  async createAssociation(
    account: HubspotAccount,
    fromObjectType: HubspotObject,
    fromObjectId: string,
    toObjectType: HubspotObject,
    toObjectId: string,
    associationSpec: AssociationSpec[],
  ): Promise<LabelsBetweenObjectPair> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const result = await client.crm.associations.v4.basicApi.create(fromObjectType, fromObjectId, toObjectType, toObjectId, associationSpec);
        this.logger.log(`[${account}] Created association: ${fromObjectId} <-> ${toObjectId}`);
        return result;
      },
      `createAssociation(${fromObjectId} <-> ${toObjectId})`,
    );
  }

  async deleteAssociation(account: HubspotAccount, fromObjectType: HubspotObject, fromObjectId: string, toObjectType: HubspotObject, toObjectId: string): Promise<void> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        await client.crm.associations.v4.basicApi.archive(fromObjectType, fromObjectId, toObjectType, toObjectId);
        this.logger.log(`[${account}] Deleted association: ${fromObjectId} <-> ${toObjectId}`);
      },
      `deleteAssociation(${fromObjectId} <-> ${toObjectId})`,
    );
  }

  async getOwner(account: HubspotAccount, ownerId: string): Promise<PublicOwner> {
    return this.execute<PublicOwner>(
      account,
      async () => {
        const client = this.getClient(account);
        return await client.crm.owners.ownersApi.getById(Number(ownerId));
      },
      `getOwner(${ownerId})`,
    );
  }

  async getOwners(account: HubspotAccount, after: string | undefined, limit: number = 100): Promise<PublicOwner[]> {
    return this.execute(
      account,
      async () => {
        const client = this.getClient(account);
        const response = await client.crm.owners.ownersApi.getPage(undefined, after, limit);
        return response.results || [];
      },
      `getOwners(limit=${limit})`,
    );
  }

  async getAccountStatus(account: HubspotAccount): Promise<AccountStatus> {
    const isConfigured = account === HubspotAccount.SOURCE ? this.isSourceConfigured : this.isDestinationConfigured;
    const token = this.configService.get<string>(account === HubspotAccount.SOURCE ? 'HUBSPOT_SOURCE_API_KEY' : 'HUBSPOT_DESTINATION_API_KEY');

    return {
      account: account,
      configured: isConfigured,
      status: isConfigured ? 'Ready' : 'Not configured',
      apiKeyPrefix: token ? `${token.substring(0, 8)}...` : undefined,
    };
  }

  async getAllAccountsStatus(): Promise<AccountStatus[]> {
    return Promise.all([this.getAccountStatus(HubspotAccount.SOURCE), this.getAccountStatus(HubspotAccount.DESTINATION)]);
  }

  getQueueStats(): QueueStats {
    return {
      pending: this.queue.pending,
      size: this.queue.size,
      concurrency: this.queue.concurrency,
    };
  }

  async clearQueue(): Promise<void> {
    this.queue.clear();
    this.logger.warn('Queue cleared manually');
  }

  async pauseQueue(): Promise<void> {
    this.queue.pause();
    this.logger.warn('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    this.queue.start();
    this.logger.log('Queue resumed');
  }

  isAccountConfigured(account: HubspotAccount): boolean {
    return account === HubspotAccount.SOURCE ? this.isSourceConfigured : this.isDestinationConfigured;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Application shutting down${signal ? ` (${signal})` : ''} - Waiting for queue to complete...`);
    await this.queue.onIdle();
    this.logger.log('All HubSpot operations completed');
  }
}
