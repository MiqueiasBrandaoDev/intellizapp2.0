import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { IntelliChatSession, IntelliChatMensagem } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useIntelliChatSessions = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all user sessions
  const {
    data: allSessionsData,
    isLoading: isLoadingAllSessions,
    refetch: refetchAllSessions
  } = useQuery({
    queryKey: ['intellichat-all-sessions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const response = await apiService.getUserSessions(profile.id);
      return response.data || [];
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Get or create active session
  const {
    data: sessionData,
    isLoading: isLoadingSession,
    error: sessionError,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['intellichat-active-session', profile?.id],
    queryFn: async () => {
      console.log('🔍 Buscando sessão ativa para profile:', profile?.id);
      if (!profile?.id) {
        console.warn('⚠️ profile.id não existe, retornando null');
        return null;
      }
      const response = await apiService.getOrCreateActiveSession(profile.id);
      console.log('✅ Sessão ativa obtida:', response.data);
      return response.data;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3, // Retry 3 times on failure
    retryDelay: 1000, // Wait 1s between retries
  });

  // Get messages from active session
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['intellichat-messages', sessionData?.id],
    queryFn: async () => {
      if (!sessionData?.id) return [];
      const response = await apiService.getSessionMessages(sessionData.id);
      return response.data || [];
    },
    enabled: !!sessionData?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create new session (soft delete old ones)
  const createNewSessionMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Usuário não autenticado');
      const response = await apiService.createNewSession(profile.id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intellichat-active-session'] });
      queryClient.invalidateQueries({ queryKey: ['intellichat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['intellichat-all-sessions'] });
      toast({
        title: 'Nova sessão criada',
        description: 'Uma nova conversa foi iniciada.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar nova sessão:', error);
      toast({
        title: 'Erro ao criar sessão',
        description: error.message || 'Não foi possível criar uma nova sessão.',
        variant: 'destructive',
      });
    },
  });

  // Save message
  const saveMessageMutation = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
      console.log('💾 Tentando salvar mensagem. sessionData:', sessionData);
      console.log('💾 sessionData.id:', sessionData?.id);

      if (!sessionData?.id) {
        console.error('❌ sessionData não tem ID!', { sessionData, profile });
        throw new Error('Sessão não encontrada');
      }

      console.log(`📤 Salvando mensagem ${role} na sessão ${sessionData.id}`);
      const response = await apiService.saveMessage(sessionData.id, role, content);
      console.log('✅ Mensagem salva com sucesso:', response);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ onSuccess: Invalidating queries para sessão:', sessionData?.id);
      queryClient.invalidateQueries({ queryKey: ['intellichat-messages', sessionData?.id] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao salvar mensagem:', error);
      toast({
        title: 'Erro ao salvar mensagem',
        description: 'A mensagem não foi salva no histórico.',
        variant: 'destructive',
      });
    },
  });

  // Download conversation as JSON (new format)
  const downloadConversation = () => {
    if (!messagesData || messagesData.length === 0) {
      toast({
        title: 'Nenhuma mensagem',
        description: 'Não há mensagens para baixar.',
        variant: 'destructive',
      });
      return;
    }

    // New format with output/title-session
    const conversationJson = {
      output: messagesData.map((msg: IntelliChatMensagem) =>
        msg.role === 'user' ? msg.content : `mensagens do agente, ${msg.content}`
      ),
      'title-session': sessionData?.titulo || 'Grupos da Conta'
    };

    const blob = new Blob([JSON.stringify(conversationJson, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = sessionData?.titulo
      ? `${sessionData.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      : `intellichat-conversa-${new Date().toISOString().split('T')[0]}.json`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Conversa baixada',
      description: 'O arquivo JSON foi baixado com sucesso.',
    });
  };

  return {
    session: sessionData,
    messages: messagesData || [],
    allSessions: allSessionsData || [],
    isLoadingSession,
    isLoadingMessages,
    isLoadingAllSessions,
    isLoading: isLoadingSession || isLoadingMessages,
    sessionError,
    messagesError,
    refetchSession,
    refetchMessages,
    refetchAllSessions,
    createNewSession: createNewSessionMutation.mutate,
    isCreatingSession: createNewSessionMutation.isPending,
    saveMessage: saveMessageMutation.mutate,
    isSavingMessage: saveMessageMutation.isPending,
    downloadConversation,
  };
};
