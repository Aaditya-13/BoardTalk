import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Board, BoardVisibility } from '@/types';

// API Calls
const fetchBoards = async (search?: string): Promise<Board[]> => {
  const { data } = await api.get('/boards', { params: { q: search } });
  return data.data;
};

const createBoard = async (payload: { title: string; description?: string; visibility?: BoardVisibility }): Promise<Board> => {
  const { data } = await api.post('/boards', payload);
  return data.data;
};

const deleteBoard = async (boardId: string): Promise<void> => {
  await api.delete(`/boards/${boardId}`);
};

const toggleStar = async (boardId: string): Promise<{ isStarred: boolean }> => {
  const { data } = await api.post(`/boards/${boardId}/star`);
  return data.data;
};

// Hooks
export const useBoards = (search?: string) => {
  return useQuery({
    queryKey: ['boards', search],
    queryFn: () => fetchBoards(search),
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

export const useToggleStarBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleStar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};
