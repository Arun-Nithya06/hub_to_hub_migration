import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertyMapping } from 'src/common/entities';
import { Repository } from 'typeorm';

@Injectable()
export class MappingService {
  constructor(
    @InjectRepository(PropertyMapping)
    private readonly mappingRepository: Repository<PropertyMapping>,
  ) {}

  /**
   * Get all active mappings grouped by entity type
   */
  async getAllMappings(): Promise<Record<string, any>> {
    const mappings = await this.mappingRepository.find({
      where: { is_active: true },
    });

    const grouped: Record<string, any> = {};

    for (const mapping of mappings) {
      if (!grouped[mapping.entity_type]) {
        grouped[mapping.entity_type] = {};
      }

      grouped[mapping.entity_type][mapping.source_field] = mapping;
    }

    return grouped;
  }

  /**
   * Apply property mappings to source data
   */
  async applyMappingsToData(entityType: string, sourceData: Record<string, any>, mappings: Record<string, any>): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const [sourceField, mapping] of Object.entries(mappings)) {
      const mappingData = mapping as any;

      let value = sourceData[sourceField];

      if (value !== undefined && value !== null && value !== '') {
        value = this.castValue(value, mappingData.data_type);

        if (value !== null && value !== undefined) {
          result[mappingData.target_field] = value;
        }
      } else if (mappingData.default_value !== null && mappingData.default_value !== undefined && mappingData.default_value !== '') {
        result[mappingData.target_field] = this.castValue(mappingData.default_value, mappingData.data_type);
      }
    }

    return result;
  }

  /**
   * Cast value based on HubSpot property type
   */
  private castValue(value: any, dataType: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      switch ((dataType || '').toLowerCase()) {
        // Numbers
        case 'number':
        case 'numeric':
          return isNaN(Number(value)) ? null : Number(value);

        // Boolean
        case 'boolean':
        case 'bool':
          return value === true || value === 'true' || value === 'TRUE' || value === 'yes' || value === 'YES' || value === 1 || value === '1';

        // HubSpot Date Property
        case 'date': {
          const date = new Date(value);

          if (isNaN(date.getTime())) {
            return null;
          }

          return date.toISOString().split('T')[0];
        }

        // HubSpot Datetime Property
        case 'datetime': {
          const date = new Date(value);

          if (isNaN(date.getTime())) {
            return null;
          }

          return date.toISOString();
        }

        // Single Select
        case 'enumeration':
        case 'select':
        case 'radio':
          return String(value).trim();

        // Multi Select
        case 'multiselect':
        case 'checkbox':
          if (Array.isArray(value)) {
            return value
              .filter(Boolean)
              .map((v) => String(v).trim())
              .join(';');
          }

          return String(value)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
            .join(';');

        // Email
        case 'email':
          return String(value).trim().toLowerCase();

        // Phone Number
        case 'phone':
        case 'phone_number':
          return String(value)
            .replace(/[^\d+]/g, '')
            .trim();

        // URL
        case 'url':
          return String(value).trim();

        // JSON
        case 'json':
          if (typeof value === 'object') {
            return value;
          }

          try {
            return JSON.parse(value);
          } catch {
            return value;
          }

        // String/Text
        case 'text':
        case 'textarea':
        case 'string':
        default:
          return String(value).trim();
      }
    } catch (error) {
      console.error(`Failed to cast value: ${value}, Type: ${dataType}`, error);

      return null;
    }
  }

  /**
   * Get mappings by entity type
   */
  async getMappingsByEntityType(entityType: string): Promise<Record<string, any>> {
    const allMappings = await this.getAllMappings();

    return allMappings[entityType] || {};
  }
}
