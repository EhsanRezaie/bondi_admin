import { client } from './client';
import type {
  MaintenanceStatusResponse,
  MaintenanceEnableResponse,
  VersionConfigResponse,
  SimpleOkResponse
} from './types';

export async function fetchMaintenanceStatus(): Promise<MaintenanceStatusResponse> {
  const { data } = await client.get<MaintenanceStatusResponse>('/system/maintenance/status');
  return data;
}

export async function enableMaintenance(message?: string): Promise<MaintenanceEnableResponse> {
  const { data } = await client.post<MaintenanceEnableResponse>('/system/maintenance/enable', { message });
  return data;
}

export async function disableMaintenance(): Promise<MaintenanceEnableResponse> {
  const { data } = await client.post<MaintenanceEnableResponse>('/system/maintenance/disable');
  return data;
}

export async function fetchVersionConfig(): Promise<VersionConfigResponse> {
  const { data } = await client.get<VersionConfigResponse>('/system/version/config');
  return data;
}

export async function setMinimumVersion(platform: string, version: string): Promise<SimpleOkResponse> {
  const { data } = await client.post<SimpleOkResponse>('/system/version/set-minimum', null, {
    params: { platform, version }
  });
  return data;
}

export async function setForceUpdate(force: boolean, message?: string): Promise<SimpleOkResponse> {
  const { data } = await client.post<SimpleOkResponse>('/system/version/force-update', null, {
    params: { force, message }
  });
  return data;
}

export async function clearVersionOverride(): Promise<SimpleOkResponse> {
  const { data } = await client.delete<SimpleOkResponse>('/system/version/override');
  return data;
}