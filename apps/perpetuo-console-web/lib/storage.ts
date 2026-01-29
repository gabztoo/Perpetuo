const TOKEN_STORAGE_KEY = 'perpetuo_token';
const WORKSPACE_STORAGE_KEY = 'perpetuo_workspace_id';

export const getStoredToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
};

export const setStoredToken = (token?: string) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const getStoredWorkspaceId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(WORKSPACE_STORAGE_KEY) ?? undefined;
};

export const setStoredWorkspaceId = (workspaceId?: string) => {
  if (typeof window === 'undefined') return;
  if (workspaceId) {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    return;
  }
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
};