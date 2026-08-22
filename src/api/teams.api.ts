/**
 * Teams API Module Abstraction
 * Operations mapping directly to QRTRAC OpenAPI spec (Phase 0 Audit)
 */

import { ApiClient } from './client';
import { ApiResponse } from '../models/api';

export interface QrTracTeam {
  id: string;
  name: string;
  orgId: string;
  role?: string;
  createdAt: number;
}

export interface ITeamsApi {
  getAllTeams(): Promise<ApiResponse<QrTracTeam[]>>;
  getTeamById(teamId: string): Promise<ApiResponse<QrTracTeam>>;
}

export class TeamsApi implements ITeamsApi {
  constructor(private client: ApiClient) {}

  async getAllTeams(): Promise<ApiResponse<QrTracTeam[]>> {
    return this.client.request<QrTracTeam[]>('/teams-api', {
      method: 'GET',
    });
  }

  async getTeamById(teamId: string): Promise<ApiResponse<QrTracTeam>> {
    return this.client.request<QrTracTeam>(`/teams-api/${teamId}`, {
      method: 'GET',
    });
  }
}
