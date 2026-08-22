/**
 * API Modules Barrel Export
 */

import { ApiClient, defaultApiClient } from './client';
import { AuthApi } from './auth.api';
import { QrsApi } from './qrs.api';
import { TemplatesApi } from './templates.api';
import { TeamsApi } from './teams.api';
import { AnalyticsApi } from './analytics.api';

export * from './client';
export * from './auth.api';
export * from './qrs.api';
export * from './templates.api';
export * from './teams.api';
export * from './analytics.api';

export interface ApiServices {
  client: ApiClient;
  auth: AuthApi;
  qrs: QrsApi;
  templates: TemplatesApi;
  teams: TeamsApi;
  analytics: AnalyticsApi;
}

export const createApiServices = (client: ApiClient = defaultApiClient): ApiServices => ({
  client,
  auth: new AuthApi(client),
  qrs: new QrsApi(client),
  templates: new TemplatesApi(client),
  teams: new TeamsApi(client),
  analytics: new AnalyticsApi(client),
});

export const api = createApiServices();
