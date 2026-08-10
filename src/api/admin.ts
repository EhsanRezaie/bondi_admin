import { client, setToken, clearToken, getToken } from './client';

export interface LoginResult {
  access_token: string;
  token_type: string;
}

export async function adminLogin(username: string, password: string): Promise<LoginResult> {
  const { data } = await client.post<LoginResult>('/admin/login', {
    username,
    password
  });
  return data;
}

export async function doLogin(username: string, password: string): Promise<void> {
  const res = await adminLogin(username, password);
  setToken(res.access_token);
}

export function ensureLogin(): boolean {
  return Boolean(getToken());
}

export function doLogout(): Promise<void> {
  clearToken();
  return Promise.resolve();
}