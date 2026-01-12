import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { CreateGrupoData, Grupo } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

// Hook para grupos da IA Pública (iaoculta = false)
export const useIAPublicaGrupos = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: gruposResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grupos-ia-publica', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const response = await apiService.getGrupos(profile.id);
      // Filtrar apenas grupos da IA Pública (iaoculta = false)
      return {
        ...response,
        data: response?.data?.filter((g: Grupo) => !g.iaoculta) || []
      };
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createGrupoMutation = useMutation({
    mutationFn: (data: CreateGrupoData) => {
      // Garantir que iaoculta seja sempre false para IA Pública
      const grupoData = { ...data, iaoculta: false };
      console.log('🟢 Criando grupo na IA Pública:', grupoData);
      return apiService.createGrupo(grupoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-publica'] });
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-oculta'] });
    },
  });

  const updateGrupoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGrupoData> }) =>
      apiService.updateGrupo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-publica'] });
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-oculta'] });
    },
  });

  const deleteGrupoMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteGrupo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-publica'] });
    },
  });

  return {
    grupos: gruposResponse?.data || [],
    pagination: gruposResponse?.pagination,
    isLoading,
    error,
    refetch,
    createGrupo: createGrupoMutation.mutate,
    updateGrupo: updateGrupoMutation.mutate,
    deleteGrupo: deleteGrupoMutation.mutate,
    isCreating: createGrupoMutation.isPending,
    isUpdating: updateGrupoMutation.isPending,
    isDeleting: deleteGrupoMutation.isPending,
  };
};

// Hook para grupos da IA Oculta (iaoculta = true)
export const useIAOcultaGrupos = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: gruposResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grupos-ia-oculta', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const response = await apiService.getGrupos(profile.id);
      // Filtrar apenas grupos da IA Oculta (iaoculta = true)
      return {
        ...response,
        data: response?.data?.filter((g: Grupo) => g.iaoculta === true) || []
      };
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createGrupoMutation = useMutation({
    mutationFn: (data: CreateGrupoData) => {
      // Garantir que iaoculta seja sempre true para IA Oculta
      console.log('🔵 [Hook IA Oculta] Dados recebidos:', data);
      const grupoData = { ...data, iaoculta: true };
      console.log('🔵 [Hook IA Oculta] Dados após forçar iaoculta=true:', grupoData);
      console.log('🔵 [Hook IA Oculta] Verificação final - iaoculta é:', grupoData.iaoculta);
      return apiService.createGrupo(grupoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-oculta'] });
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-publica'] });
    },
  });

  const updateGrupoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGrupoData> }) =>
      apiService.updateGrupo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-oculta'] });
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-publica'] });
    },
  });

  const deleteGrupoMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteGrupo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-ia-oculta'] });
    },
  });

  return {
    grupos: gruposResponse?.data || [],
    pagination: gruposResponse?.pagination,
    isLoading,
    error,
    refetch,
    createGrupo: createGrupoMutation.mutate,
    updateGrupo: updateGrupoMutation.mutate,
    deleteGrupo: deleteGrupoMutation.mutate,
    isCreating: createGrupoMutation.isPending,
    isUpdating: updateGrupoMutation.isPending,
    isDeleting: deleteGrupoMutation.isPending,
  };
};

// Hook para verificar se um grupo existe em alguma IA
export const useCheckGrupoExists = () => {
  const { profile } = useAuth();

  const checkGrupoExists = async (grupoIdExterno: string): Promise<{
    exists: boolean;
    grupo?: Grupo;
    isOculta?: boolean;
  }> => {
    if (!profile?.id) {
      return { exists: false };
    }

    try {
      const response = await apiService.getGrupos(profile.id);
      const grupo = response?.data?.find((g: Grupo) => g.grupo_id_externo === grupoIdExterno);

      if (grupo) {
        return {
          exists: true,
          grupo,
          isOculta: grupo.iaoculta === true
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar grupo:', error);
      return { exists: false };
    }
  };

  return { checkGrupoExists };
};
