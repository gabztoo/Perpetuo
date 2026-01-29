import api from '@/lib/api';
import { getStoredWorkspaceId, setStoredWorkspaceId } from '@/lib/storage';

export const ensureWorkspaceId = async (): Promise<string | undefined> => {
  const cached = getStoredWorkspaceId();
  if (cached) return cached;

  const response = await api.get('/workspaces');
  const payload = response.data?.data ?? response.data?.workspaces ?? response.data;
  const firstWorkspace = Array.isArray(payload) ? payload[0] : undefined;

  if (firstWorkspace?.id) {
    setStoredWorkspaceId(firstWorkspace.id);
    return firstWorkspace.id;
  }

  return undefined;
};