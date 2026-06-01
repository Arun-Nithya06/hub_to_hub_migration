import { Global, Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { HubspotService } from './hubspot.service';

@Global()
@Module({
  providers: [HubspotService, ConfigService],
  exports: [HubspotService],
})
export class HubspotModule {}
