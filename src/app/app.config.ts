import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {authInterceptor} from "./auth/http-auth.interceptor";
import {authExpiredInterceptor} from "./auth/auth-expired.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, authExpiredInterceptor])),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes)]
};
