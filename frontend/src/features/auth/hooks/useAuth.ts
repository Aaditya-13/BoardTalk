import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuthUser } from '@/types';

// API Calls
const fetchCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await api.get('/users/me');
  return data.data; // Assumes `{ success: true, data: AuthUser }`
};

const guestLogin = async (): Promise<{ accessToken: string; user: AuthUser }> => {
  const { data } = await api.post('/auth/guest');
  return data.data;
};

const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

// Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: false, // Don't retry on 401
  });
};

export const useGuestLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
      window.location.href = '/';
    },
  });
};
