import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

// API Calls
const fetchCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await api.get('/users/me');
  return data.data; // Assumes `{ success: true, data: AuthUser }`
};

const guestLogin = async (): Promise<{ accessToken: string; user: AuthUser }> => {
  const { data } = await api.post('/auth/guest');
  return data.data;
};

const updateProfile = async (payload: { name?: string; avatarUrl?: string }): Promise<AuthUser> => {
  const { data } = await api.patch('/users/me', payload);
  return data.data;
};

const uploadAvatar = async (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const { data } = await api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.data;
};

// const devLogin = async (name: string): Promise<{ accessToken: string; user: AuthUser }> => {
//   const { data } = await api.post('/auth/dev-login', { name });
//   return data.data;
// };

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

// export const useDevLogin = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: devLogin,
//     onSuccess: (data) => {
//       queryClient.setQueryData(['currentUser'], data.user);
//     },
//   });
// };

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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
    },
  });
};
