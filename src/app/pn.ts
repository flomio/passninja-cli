import { NgModule } from '@angular/core';

import { pnMain } from './pn-main';
import { LocalSessionHandlerService } from './services/readers/sessions/local/local-session-handler.service';
import { AbstractSessionHandlerService } from './services/readers/sessions/abstract-session-handler.service';

pnMain({
  includeAdmin: true,
  includeSigning: true,
  configure: config => ({
    overrides: config.nfc.keys
      ? [
          {
            provide: AbstractSessionHandlerService,
            useClass: LocalSessionHandlerService
          }
        ]
      : []
  })
});
