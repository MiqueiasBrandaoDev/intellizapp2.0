import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useResumos = (
  page: number = 1,
  limit: number = 20,
  dataInicio?: string,
  dataFim?: string,
  grupoId?: number,
  status?: string
) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: resumosResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['resumos', profile?.id, page, limit, dataInicio, dataFim, grupoId, status],
    queryFn: () =>
      profile ? apiService.getResumos(profile.id, page, limit, dataInicio, dataFim, grupoId, status) : Promise.resolve(null),
    enabled: !!profile?.id,
  });

  const gerarResumoMutation = useMutation({
    mutationFn: (grupoId: number) => apiService.gerarResumo(grupoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumos'] });
    },
  });

  return {
    resumos: resumosResponse?.data || [],
    pagination: resumosResponse?.pagination,
    isLoading,
    error,
    refetch,
    gerarResumo: gerarResumoMutation.mutate,
    isGenerating: gerarResumoMutation.isPending,
  };
};