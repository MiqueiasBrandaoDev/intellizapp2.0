import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useDashboardStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboardStats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      const response = await apiService.getDashboardStats(profile.id);
      if (!response.success) throw new Error(response.message || 'Failed to fetch stats');
      return response.data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecentActivity = (limit: number = 5) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['recentActivity', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      const response = await apiService.getRecentActivity(profile.id, limit);
      if (!response.success) throw new Error(response.message || 'Failed to fetch activity');
      return response.data;
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSystemInsights = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['systemInsights', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      const response = await apiService.getSystemInsights(profile.id);
      if (!response.success) throw new Error(response.message || 'Failed to fetch insights');
      return response.data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};