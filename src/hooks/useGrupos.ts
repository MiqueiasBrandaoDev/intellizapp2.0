import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Grupo, CreateGrupoData, GrupoWithMensagens } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export const useGrupos = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: gruposResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grupos', profile?.id],
    queryFn: () => profile ? apiService.getGrupos(profile.id) : Promise.resolve(null),
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
  });

  const createGrupoMutation = useMutation({
    mutationFn: (data: CreateGrupoData) => apiService.createGrupo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
    },
  });

  const updateGrupoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateGrupoData> }) =>
      apiService.updateGrupo(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar queries em execução para evitar conflitos
      await queryClient.cancelQueries({ queryKey: ['grupos', profile?.id] });

      // Snapshot dos dados atuais
      const previousGroups = queryClient.getQueryData(['grupos', profile?.id]);

      // Atualização otimista mais segura
      queryClient.setQueryData(['grupos', profile?.id], (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;

        return {
          ...old,
          data: old.data.map((grupo: Grupo) =>
            grupo.id === id ? { ...grupo, ...data, updated_at: new Date().toISOString() } : grupo
          )
        };
      });

      return { previousGroups };
    },
    onError: (err, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousGroups) {
        queryClient.setQueryData(['grupos', profile?.id], context.previousGroups);
      }
    },
    onSuccess: () => {
      // Apenas invalidar em caso de sucesso para manter dados atualizados
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['grupos', profile?.id] });
      }, 100);
    },
  });

  const deleteGrupoMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteGrupo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
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
    createError: createGrupoMutation.error,
    updateError: updateGrupoMutation.error,
    deleteError: deleteGrupoMutation.error,
  };
};

export const useGrupo = (id: number) => {
  const {
    data: grupoResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grupo', id],
    queryFn: () => apiService.getGrupo(id),
    enabled: !!id,
  });

  return {
    grupo: grupoResponse?.data,
    isLoading,
    error,
    refetch,
  };
};