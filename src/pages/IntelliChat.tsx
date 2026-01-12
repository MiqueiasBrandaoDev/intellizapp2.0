import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, User, Sparkles, RotateCcw, Download, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/api';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useIntelliChatSessions } from '@/hooks/useIntelliChatSessions';
import { IntelliChatMensagem } from '@/types/database';
import { IntelliChatHistoryModal } from '@/components/IntelliChatHistoryModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function IntelliChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const voiceRecording = useVoiceRecording();
  const {
    session,
    messages: dbMessages,
    allSessions,
    isLoading: isLoadingSession,
    isLoadingAllSessions,
    saveMessage,
    createNewSession,
    isCreatingSession,
    downloadConversation,
    refetchSession,
    refetchMessages,
    refetchAllSessions,
  } = useIntelliChatSessions();

  const placeholders = [
    "Resuma as conversas de hoje...",
    "Quais foram os principais tópicos discutidos?",
    "Mostre insights sobre o grupo X...",
    "Há alguma mensagem urgente?",
    "Analise o sentimento das conversas recentes...",
  ];

  // Load messages from database when session is ready
  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const loadedMessages: Message[] = dbMessages.map((msg: IntelliChatMensagem) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.criado_em),
      }));
      setMessages(loadedMessages);
    }
  }, [dbMessages]);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  // When audio blob is ready, transcribe it
  useEffect(() => {
    if (voiceRecording.audioBlob && !voiceRecording.isRecording && showVoiceInput) {
      handleVoiceRecordingComplete();
    }
  }, [voiceRecording.audioBlob, voiceRecording.isRecording, showVoiceInput]);

  const sendMessageToAI = async (input: string) => {
    try {
      const result = await apiService.sendIntelliChatMessage(input);
      console.log('📥 Resposta completa da API:', result);

      // Pega o output (array de strings)
      const output = result.data?.output;
      const titleSession = result.data?.['title-session'] as string | undefined;

      console.log('📤 Output recebido:', output);
      console.log('📌 Título recebido:', titleSession);

      if (!output || !Array.isArray(output)) {
        console.error('❌ Output inválido:', result);
        throw new Error('Output não encontrado na resposta');
      }

      // Junta todas as strings do output em uma só
      const responseText = output.join('\n');

      // Salva o título se existir e a sessão não tiver um
      if (titleSession && session?.id && !session.titulo) {
        console.log('💾 Salvando título da sessão:', titleSession);
        await apiService.updateSessionTitle(session.id, titleSession);
      }

      return responseText;
    } catch (error) {
      console.error('❌ Error sending message to AI:', error);
      throw error;
    }
  };

  const streamMessage = (messageId: string, fullContent: string) => {
    let currentIndex = 0;
    setStreamingMessageId(messageId);

    const intervalId = setInterval(() => {
      if (currentIndex < fullContent.length) {
        const charsToAdd = Math.min(2, fullContent.length - currentIndex); // Add 1-2 chars at a time for natural feel
        currentIndex += charsToAdd;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: fullContent.substring(0, currentIndex) }
              : msg
          )
        );
      } else {
        clearInterval(intervalId);
        setStreamingMessageId(null);
      }
    }, 30); // 30ms delay between characters for smooth streaming effect
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Save user message to database
    saveMessage({ role: 'user', content: userMessageContent });

    try {
      const result = await apiService.sendIntelliChatMessage(userMessageContent);
      console.log('📥 Resposta completa da API:', result);

      // A estrutura correta é: result.data.output.output e result.data.output.title_session
      const responseData = result.data?.output || result.data;

      let output = responseData?.output || responseData?.response;
      const titleSession = responseData?.title_session || responseData?.['title-session'];

      console.log('📤 Output extraído:', output);
      console.log('📤 Tipo do output:', typeof output);
      console.log('📌 Título extraído:', titleSession);

      if (!output) {
        console.error('❌ Nenhum output encontrado. Dados completos:', result);
        throw new Error('Output não encontrado na resposta');
      }

      // Se output for string, converte para array
      if (typeof output === 'string') {
        output = [output];
      }

      // Se não for array ainda, tenta converter
      if (!Array.isArray(output)) {
        console.error('❌ Output não é array nem string:', typeof output, output);
        throw new Error('Output em formato inválido');
      }

      console.log('✅ Output processado com sucesso. Total de mensagens:', output.length);

      // Salva o título se existir e a sessão não tiver um
      if (titleSession && session?.id && !session.titulo) {
        console.log('💾 Salvando título da sessão:', titleSession);
        await apiService.updateSessionTitle(session.id, titleSession);
      }

      // Remove o loading antes de começar o streaming
      setIsLoading(false);

      // Processa cada item do output
      for (let i = 0; i < output.length; i++) {
        const content = output[i];
        console.log(`📝 Processando mensagem ${i + 1}/${output.length}:`, content.substring(0, 50) + '...');

        // Cria mensagem na UI com conteúdo vazio
        const assistantMessage: Message = {
          id: `${Date.now()}-${i}`,
          role: 'assistant',
          content: '', // Start with empty content
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Aguarda um pouco para garantir que a mensagem foi adicionada ao DOM
        await new Promise(resolve => setTimeout(resolve, 50));

        // Inicia o streaming
        await new Promise<void>((resolve) => {
          let currentIndex = 0;
          setStreamingMessageId(assistantMessage.id);

          const intervalId = setInterval(() => {
            if (currentIndex < content.length) {
              const charsToAdd = Math.min(3, content.length - currentIndex);
              currentIndex += charsToAdd;

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: content.substring(0, currentIndex) }
                    : msg
                )
              );
            } else {
              clearInterval(intervalId);
              setStreamingMessageId(null);
              resolve();
            }
          }, 20);
        });

        // Salva mensagem do assistente no banco após streaming
        saveMessage({ role: 'assistant', content });

        // Pequeno delay entre mensagens
        if (i < output.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log('✅ Todas as mensagens processadas com sucesso!');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Save error message to database
      saveMessage({ role: 'assistant', content: errorMessage.content });

      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      console.log('🔄 Selecionando sessão:', sessionId);

      // Activate the selected session
      await apiService.activateSession(sessionId);
      console.log('✅ Sessão ativada no backend');

      // Load messages from selected session
      const sessionMessages = await apiService.getSessionMessages(sessionId);
      if (sessionMessages.data) {
        const loadedMessages: Message[] = sessionMessages.data.map((msg: IntelliChatMensagem) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.criado_em),
        }));
        setMessages(loadedMessages);
        console.log(`✅ ${loadedMessages.length} mensagens carregadas`);
      }

      // Refetch sessions and active session to update the UI - AGUARDAR completar
      console.log('🔄 Atualizando estado das sessões...');
      await Promise.all([
        refetchAllSessions(),
        refetchSession()
      ]);
      console.log('✅ Estado atualizado. Nova sessão ativa:', sessionId);
    } catch (error) {
      console.error('❌ Erro ao selecionar sessão:', error);
    }
  };

  // Função para processar o conteúdo e substituir \n literais por quebras de linha reais
  const formatMessageContent = (content: string): string => {
    // Replace literal \n with actual line breaks
    return content.replace(/\\n/g, '\n');
  };

  const handleVoiceRecordingComplete = useCallback(async () => {
    if (!voiceRecording.audioBlob) {
      console.error('❌ Nenhum áudio gravado');
      return;
    }

    setIsTranscribing(true);

    try {
      console.log('🎤 Transcrevendo áudio...');
      const result = await apiService.transcribeAudio(voiceRecording.audioBlob);

      const transcribedText = result.data?.text?.trim() || '';

      if (transcribedText) {
        console.log('✅ Texto transcrito com sucesso:', transcribedText);
        setInputValue(transcribedText);
        setShowVoiceInput(false);
        voiceRecording.clearRecording();
      } else {
        console.error('❌ Nenhum texto foi retornado pela transcrição');
        alert('Não foi possível transcrever o áudio. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao transcrever áudio:', error);
      alert('Erro ao transcrever áudio. Verifique sua conexão e tente novamente.');
    } finally {
      setIsTranscribing(false);
    }
  }, [voiceRecording]);

  return (
    <div className="flex flex-col fixed inset-0 top-16 lg:left-64 xl:left-72 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">IntelliChat</h1>
              <p className="text-xs text-muted-foreground">
                Converse com sua inteligência artificial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadConversation}
              disabled={messages.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                createNewSession();
                setMessages([]);
              }}
              disabled={isCreatingSession}
              className="gap-2"
            >
              {isCreatingSession ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Nova Sessão</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Olá! Como posso ajudar?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Faça perguntas sobre seus grupos, mensagens ou peça análises e resumos.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{formatMessageContent(message.content)}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </Card>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <Card className="bg-muted p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Invisible element at the end for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          {!showVoiceInput ? (
            <div className="space-y-4">
              <PlaceholdersAndVanishInput
                placeholders={placeholders}
                onChange={handleChange}
                onSubmit={handleSubmit}
                value={inputValue}
              />
              <button
                onClick={() => setShowVoiceInput(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
              >
                Ou clique aqui para usar voz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {isTranscribing ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Transcrevendo áudio...</p>
                </div>
              ) : (
                <>
                  <AIVoiceInput
                    isRecording={voiceRecording.isRecording}
                    recordingTime={voiceRecording.recordingTime}
                    onStart={async () => {
                      console.log('🎤 Iniciando gravação...');
                      await voiceRecording.startRecording();
                    }}
                    onStop={() => {
                      console.log('⏹️ Parando gravação...');
                      voiceRecording.stopRecording();
                    }}
                  />
                  {voiceRecording.error && (
                    <p className="text-xs text-destructive text-center">
                      {voiceRecording.error}
                    </p>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  setShowVoiceInput(false);
                  voiceRecording.clearRecording();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
                disabled={isTranscribing}
              >
                Voltar para texto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      <IntelliChatHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        sessions={allSessions}
        isLoading={isLoadingAllSessions}
        onSelectSession={handleSelectSession}
      />
    </div>
  );
}
