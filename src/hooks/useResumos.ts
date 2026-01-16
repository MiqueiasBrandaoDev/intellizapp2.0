import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useResumos = (
  page: number = 1,
  limit: number = 20,
  dataInicio?: string,
  dataFim?: string,
  grupoId?: number,
  status?: string,
  iaoculta?: boolean
) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: resumosResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['resumos', profile?.id, page, limit, dataInicio, dataFim, grupoId, status, iaoculta],
    queryFn: () =>
      profile ? apiService.getResumos(profile.id, page, limit, dataInicio, dataFim, grupoId, status, iaoculta) : Promise.resolve(null),
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

// Hook para buscar resumos da IA Publica (iaoculta = false)
export const useResumosIAPublica = (
  page: number = 1,
  limit: number = 20,
  searchTerm?: string
) => {
  const result = useResumos(page, limit, undefined, undefined, undefined, undefined, false);

  // Filtrar localmente por termo de busca se fornecido
  const filteredResumos = searchTerm
    ? result.resumos.filter(resumo =>
        resumo.grupo_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resumo.conteudo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : result.resumos;

  return {
    ...result,
    resumos: filteredResumos,
  };
};

// Hook para buscar resumos da IA Oculta (iaoculta = true)
export const useResumosIAOculta = (
  page: number = 1,
  limit: number = 20,
  searchTerm?: string
) => {
  const result = useResumos(page, limit, undefined, undefined, undefined, undefined, true);

  // Filtrar localmente por termo de busca se fornecido
  const filteredResumos = searchTerm
    ? result.resumos.filter(resumo =>
        resumo.grupo_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resumo.conteudo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : result.resumos;

  return {
    ...result,
    resumos: filteredResumos,
  };
};