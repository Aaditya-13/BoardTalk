import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Collaborator {
  id: string;
  boardId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

const fetchCollaborators = async (boardId: string): Promise<Collaborator[]> => {
  const { data } = await api.get(`/boards/${boardId}/collaborators`);
  return data.data;
};

const updateCollaborator = async ({ boardId, collaboratorId, role }: { boardId: string, collaboratorId: string, role: string }): Promise<Collaborator> => {
  const { data } = await api.patch(`/boards/${boardId}/collaborators/${collaboratorId}`, { role });
  return data.data;
};

const removeCollaborator = async ({ boardId, collaboratorId }: { boardId: string, collaboratorId: string }): Promise<void> => {
  await api.delete(`/boards/${boardId}/collaborators/${collaboratorId}`);
};

export const useCollaborators = (boardId: string) => {
  return useQuery({
    queryKey: ['collaborators', boardId],
    queryFn: () => fetchCollaborators(boardId),
    enabled: !!boardId,
  });
};

export const useUpdateCollaborator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCollaborator,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.boardId] });
    },
  });
};

export const useRemoveCollaborator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCollaborator,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.boardId] });
    },
  });
};
