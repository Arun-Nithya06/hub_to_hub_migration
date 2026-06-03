import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { ExportService } from './export.service';
import { HubspotAccount } from 'src/libs/hubspot/hubspot.enums';

@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private getAccount(account: string): HubspotAccount {
    switch (account.toLowerCase()) {
      case 'source':
        return HubspotAccount.SOURCE;

      case 'destination':
        return HubspotAccount.DESTINATION;

      default:
        throw new BadRequestException(`Invalid account: ${account}. Use 'source' or 'destination'`);
    }
  }

  @Post(':account')
  async createExport(@Param('account') account: string, @Body() exportRequest: any) {
    return this.exportService.createExport(this.getAccount(account), exportRequest);
  }

  @Get(':account/:exportId/status')
  async getExportStatus(@Param('account') account: string, @Param('exportId') exportId: string) {
    return this.exportService.getExportStatus(this.getAccount(account), Number(exportId));
  }
}
