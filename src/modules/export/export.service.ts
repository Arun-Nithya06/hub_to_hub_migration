import { Injectable, Logger } from '@nestjs/common';
import { PublicExportRequest } from '@hubspot/api-client/lib/codegen/crm/exports/models/all';
import { HubspotAccount } from 'src/libs/hubspot/hubspot.enums';
import { HubspotService } from 'src/libs/hubspot/hubspot.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly hubspotService: HubspotService) {}

  async createExport(account: HubspotAccount, exportRequest: PublicExportRequest) {
    this.logger.log(`Creating export for account ${account} with request: ${JSON.stringify(exportRequest)}`);
    const result = await this.hubspotService.exportWithAxios(account, exportRequest);
    return result;
  }

  async getExportStatus(account: HubspotAccount, exportId: number) {
    const status = await this.hubspotService.getExportStatus(account, exportId);
    return status;
  }
}
