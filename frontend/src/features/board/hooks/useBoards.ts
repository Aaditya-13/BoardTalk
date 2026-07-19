import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Board, BoardVisibility } from '@/types';

// API Calls
const fetchBoards = async (search?: string, filter: 'all' | 'starred' | 'trash' = 'all'): Promise<Board[]> => {
  const endpoint = filter === 'all' ? '/boards' : `/boards/${filter}`;
  const { data } = await api.get(endpoint, { params: { q: search } });
  return data.data;
};

const fetchBoard = async (boardId: string): Promise<Board> => {
  const { data } = await api.get(`/boards/${boardId}`);
  return data.data;
};

const createBoard = async (payload: { title: string; description?: string; visibility?: BoardVisibility }): Promise<Board> => {
  const { data } = await api.post('/boards', payload);
  return data.data;
};

const updateBoard = async ({ boardId, payload }: { boardId: string, payload: { title?: string; description?: string; canvasColor?: string | null } }): Promise<Board> => {
  const { data } = await api.patch(`/boards/${boardId}`, payload);
  return data.data;
};

const deleteBoard = async (boardId: string): Promise<void> => {
  await api.delete(`/boards/${boardId}`);
};

const toggleStar = async (boardId: string): Promise<{ isStarred: boolean }> => {
  const { data } = await api.post(`/boards/${boardId}/star`);
  return data.data;
};

const duplicateBoard = async (boardId: string): Promise<Board> => {
  const { data } = await api.post(`/boards/${boardId}/copy`);
  return data.data;
};

// Hooks
export const useBoards = (search?: string, filter: 'all' | 'starred' | 'trash' = 'all') => {
  return useQuery({
    queryKey: ['boards', filter, search],
    queryFn: () => fetchBoards(search, filter),
  });
};

export const useBoard = (boardId: string) => {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId),
    enabled: !!boardId,
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};

export const useUpdateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBoard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
};

export const useToggleStarBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleStar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};

export const useDuplicateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};
