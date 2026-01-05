import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface EvolutionGroup {
  nome_grupo: string;
  grupo_id_externo: string;
  participantes: number;
}

interface EvolutionGroupsContextType {
  evolutionGroups: EvolutionGroup[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  preloadGroups: (instanceName: string) => void;
  isRetrying: boolean;
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

const EvolutionGroupsContext = createContext<EvolutionGroupsContextType | undefined>(undefined);

export const useEvolutionGroupsContext = () => {
  const context = useContext(EvolutionGroupsContext);
  if (context === undefined) {
    throw new Error('useEvolutionGroupsContext must be used within an EvolutionGroupsProvider');
  }
  return context;
};

export const EvolutionGroupsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const instanceName = profile?.instancia || profile?.nome || '';

  // Função para verificar conexão com WhatsApp
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!instanceName) return false;

    try {
      const response = await apiService.getEvolutionStatus(instanceName);
      const connected = response.connected || response.state === 'open';
      setIsConnected(connected);

      // Se conectou, carrega os grupos automaticamente
      if (connected && profile?.id) {
        console.log('✅ WhatsApp conectado! Carregando grupos automaticamente...');
        setShouldLoad(true);
        // Dispara evento para outros componentes
        window.dispatchEvent(new CustomEvent('whatsappConnected', {
          detail: { instanceName, connected: true }
        }));
      }

      return connected;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      return false;
    }
  }, [instanceName, profile?.id]);

  // Verificar conexão automaticamente ao iniciar
  useEffect(() => {
    if (isAuthenticated && instanceName && profile?.id) {
      // Verifica conexão imediatamente
      checkConnection();

      // Configura intervalo para verificar conexão periodicamente (a cada 30s)
      const connectionCheckInterval = setInterval(() => {
        if (!isConnected) {
          checkConnection();
        }
      }, 30000);

      return () => clearInterval(connectionCheckInterval);
    }
  }, [isAuthenticated, instanceName, profile?.id, checkConnection, isConnected]);

  // Query para carregar grupos da Evolution API
  const {
    data: evolutionGroupsResponse,
    isLoading,
    error,
    refetch,
    isSuccess,
    isError
  } = useQuery({
    queryKey: ['evolutionGroups', instanceName, profile?.id],
    queryFn: () =>
      profile && instanceName ? apiService.getEvolutionGroups(instanceName, profile.id) : Promise.resolve(null),
    enabled: !!profile?.id && !!instanceName && instanceName.trim() !== '' && (shouldLoad || isAuthenticated),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: true, // Recarregar quando a página ganhar foco
    refetchOnMount: true, // Recarregar quando o componente for montado
    retry: (failureCount, error: any) => {
      // Retry até 2 vezes se for erro de timeout ou 500
      if (failureCount < 2) {
        const isTimeoutError = error?.message?.includes('timeout') ||
                              error?.message?.includes('demorando') ||
                              error?.message?.includes('WhatsApp está demorando');
        const is500Error = error?.message?.includes('500') || error?.message?.includes('Internal Server Error');

        if (isTimeoutError || is500Error) {
          console.log(`🔄 Retry ${failureCount + 1}/2 for Evolution Groups due to timeout/500 error`);
          setIsRetrying(true);
          return true;
        }
      }
      setIsRetrying(false);
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  });

  // Handle success/error states (onSuccess/onError removed in React Query v5)
  useEffect(() => {
    if (isSuccess || isError) {
      setIsRetrying(false);
    }
  }, [isSuccess, isError]);

  // Função para pré-carregar grupos (chamada no login)
  const preloadGroups = (instanceName: string) => {
    if (instanceName && profile?.id) {
      setShouldLoad(true);
      // Força o fetch imediatamente
      queryClient.invalidateQueries({ queryKey: ['evolutionGroups', instanceName, profile.id] });
    }
  };

  // Carregar grupos automaticamente quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && profile && instanceName) {
      setShouldLoad(true);
    }
  }, [isAuthenticated, profile, instanceName]);

  // Escutar evento de login para começar carregamento imediatamente
  useEffect(() => {
    const handleUserLoggedIn = (event: CustomEvent) => {
      const { user: loggedUser } = event.detail;
      if (loggedUser?.nome) {
        console.log('🚀 Iniciando carregamento de grupos após login...');
        preloadGroups(loggedUser.nome);
      }
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    };
  }, [preloadGroups]);

  // Limpar cache quando o usuário fizer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setShouldLoad(false);
      queryClient.removeQueries({ queryKey: ['evolutionGroups'] });
    }
  }, [isAuthenticated, queryClient]);

  const value = {
    evolutionGroups: evolutionGroupsResponse?.data || [],
    isLoading,
    error,
    refetch,
    preloadGroups,
    isRetrying,
    isConnected,
    checkConnection,
  };

  return (
    <EvolutionGroupsContext.Provider value={value}>
      {children}
    </EvolutionGroupsContext.Provider>
  );
};