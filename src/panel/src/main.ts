import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const appRoot = document.createElement('fwl-panel');
document.body.appendChild(appRoot);
bootstrapApplication(AppComponent, appConfig);
