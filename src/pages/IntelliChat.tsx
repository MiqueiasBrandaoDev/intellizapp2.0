import { useState, useEffect, useRef } from 'react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { Card } from '@/components/ui/card';
import { Loader2, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "Resuma as conversas de hoje...",
    "Quais foram os principais tópicos discutidos?",
    "Mostre insights sobre o grupo X...",
    "Há alguma mensagem urgente?",
    "Analise o sentimento das conversas recentes...",
  ];

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  const sendMessageToAI = async (input: string) => {
    try {
      // Chamada através do backend para evitar CORS
      const response = await fetch('/api/intellichat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('intellizapp_token')}`,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response || data.output || 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
      console.error('Error sending message to AI:', error);
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(inputValue);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '', // Start with empty content
        timestamp: new Date(),
      };

      // Add empty message first, then stream the content
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Start streaming the response
      streamMessage(assistantMessage.id, aiResponse);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5">
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              <AIVoiceInput
                onStart={() => console.log('Voice recording started')}
                onStop={(duration) => {
                  console.log('Voice recording stopped, duration:', duration);
                  // TODO: Implement voice-to-text conversion
                }}
              />
              <button
                onClick={() => setShowVoiceInput(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
              >
                Voltar para texto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
