import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Invite {
  id: string;
  boardId: string;
  token: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  type: 'LINK' | 'SHORT_CODE';
  uses: number;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const fetchInvites = async (boardId: string): Promise<Invite[]> => {
  const { data } = await api.get(`/boards/${boardId}/invites`);
  return data.data;
};

const createInvite = async ({ boardId, payload }: { boardId: string, payload: any }): Promise<Invite> => {
  const { data } = await api.post(`/boards/${boardId}/invites`, payload);
  return data.data;
};

const revokeInvite = async ({ boardId, inviteId }: { boardId: string, inviteId: string }): Promise<void> => {
  await api.delete(`/boards/${boardId}/invites/${inviteId}`);
};

const acceptInvite = async (token: string): Promise<any> => {
  const { data } = await api.post(`/invites/accept`, { token });
  return data.data;
};

export const useInvites = (boardId: string) => {
  return useQuery({
    queryKey: ['invites', boardId],
    queryFn: () => fetchInvites(boardId),
    enabled: !!boardId,
  });
};

export const useCreateInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invites', variables.boardId] });
    },
  });
};

export const useRevokeInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invites', variables.boardId] });
    },
  });
};

export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: acceptInvite,
  });
};
