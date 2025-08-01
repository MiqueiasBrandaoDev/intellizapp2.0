import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Grupo, CreateGrupoData, GrupoWithMensagens } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export const useGrupos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: gruposResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['grupos', user?.id],
    queryFn: () => user ? apiService.getGrupos(user.id) : Promise.resolve(null),
    enabled: !!user?.id,
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
      await queryClient.cancelQueries({ queryKey: ['grupos', user?.id] });
      
      // Snapshot dos dados atuais
      const previousGroups = queryClient.getQueryData(['grupos', user?.id]);
      
      // Atualização otimista
      queryClient.setQueryData(['grupos', user?.id], (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((grupo: Grupo) => 
            grupo.id === id ? { ...grupo, ...data } : grupo
          )
        };
      });
      
      return { previousGroups };
    },
    onError: (err, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousGroups) {
        queryClient.setQueryData(['grupos', user?.id], context.previousGroups);
      }
    },
    onSettled: () => {
      // Sempre invalidar após a operação
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
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