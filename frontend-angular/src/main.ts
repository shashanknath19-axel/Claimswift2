import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// SockJS transitively expects Node-style globals in browser context.
const browserGlobal = window as unknown as {
  global?: unknown;
  process?: { env: Record<string, string> };
};

browserGlobal.global = browserGlobal;
browserGlobal.process = browserGlobal.process ?? { env: {} };

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
