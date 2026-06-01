// hubspot-property-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HubspotService } from '../../libs/hubspot/hubspot.service';
import { HubspotAccount, HubspotObject } from '../../libs/hubspot/hubspot.enums';
import { Property } from '@hubspot/api-client/lib/codegen/crm/properties';

@Injectable()
export class HubspotPropertyCacheService {
  private readonly logger = new Logger(HubspotPropertyCacheService.name);

  // Simple cache storage
  private propertyCache = new Map<string, Property[]>();
  private lastFetch = new Map<string, number>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(private readonly hubspotService: HubspotService) {}

  /**
   * Get writable properties for any object type (cached)
   */
  async getWritableProperties(account: HubspotAccount, objectType: HubspotObject): Promise<Property[]> {
    const cacheKey = `${account}:${objectType}`;
    const now = Date.now();

    // Return from cache if valid - FIXED: safely get lastFetch value
    const lastFetchTime = this.lastFetch.get(cacheKey);
    if (this.propertyCache.has(cacheKey) && lastFetchTime && now - lastFetchTime < this.CACHE_TTL) {
      const cached = this.propertyCache.get(cacheKey);
      if (cached) {
        // FIXED: check if cached exists
        this.logger.debug(`Using cached ${objectType} properties for ${account}`);
        return cached;
      }
    }

    // Fetch from HubSpot API
    this.logger.log(`Fetching ${objectType} properties from ${account}...`);
    const allProperties = await this.hubspotService.getAllProperties(account, objectType);

    const writableProperties = allProperties.filter((property) => property.hubspotDefined !== true && !property.archived && !property.hidden);

    this.propertyCache.set(cacheKey, writableProperties);
    this.lastFetch.set(cacheKey, now);

    this.logger.log(`Cached ${writableProperties.length} writable properties for ${objectType}`);
    return writableProperties;
  }

  /**
   * Get property names only (simplified)
   */
  async getPropertyNames(account: HubspotAccount, objectType: HubspotObject): Promise<Set<string>> {
    const properties = await this.getWritableProperties(account, objectType);
    return new Set(properties.map((p) => p.name));
  }

  /**
   * Clear cache
   */
  clearCache(account?: HubspotAccount, objectType?: HubspotObject): void {
    if (account && objectType) {
      const key = `${account}:${objectType}`;
      this.propertyCache.delete(key);
      this.lastFetch.delete(key);
      this.logger.log(`Cleared cache for ${account}:${objectType}`);
    } else {
      this.propertyCache.clear();
      this.lastFetch.clear();
      this.logger.log('Cleared all property caches');
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): Array<{ cacheKey: string; propertyCount: number; age: string }> {
    const stats: Array<{ cacheKey: string; propertyCount: number; age: string }> = []; // FIXED: added type

    for (const [key, props] of this.propertyCache.entries()) {
      const lastFetch = this.lastFetch.get(key);
      stats.push({
        cacheKey: key,
        propertyCount: props.length,
        age: lastFetch ? Math.round((Date.now() - lastFetch) / 1000) + 's' : 'unknown',
      });
    }
    return stats;
  }
}
