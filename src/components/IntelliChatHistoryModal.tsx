import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntelliChatSession } from '@/types/database';
import { Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntelliChatHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: IntelliChatSession[];
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
}

export function IntelliChatHistoryModal({
  open,
  onOpenChange,
  sessions,
  isLoading,
  onSelectSession,
}: IntelliChatHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Histórico de Conversas
          </DialogTitle>
          <DialogDescription>
            Visualize e acesse todas as suas conversas anteriores com o ResumeChat.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary hover:bg-accent ${
                    session.ativa ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">
                        {session.titulo || 'Conversa sem título'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(session.criado_em), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    {session.ativa && (
                      <span className="px-2 py-1 text-xs rounded-full bg-primary text-primary-foreground">
                        Ativa
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
