import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { ResumoWithGrupo } from '@/types/database';

interface ResumoModalProps {
  resumo: ResumoWithGrupo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'publica' | 'oculta';
}

export const ResumoModal: React.FC<ResumoModalProps> = ({
  resumo,
  open,
  onOpenChange,
  variant = 'publica'
}) => {
  if (!resumo) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const iconColor = variant === 'publica' ? 'text-blue-500' : 'text-purple-500';
  const badgeColor = variant === 'publica'
    ? 'bg-green-500/20 text-green-400'
    : 'bg-purple-500/20 text-purple-400';

  const getStatusBadge = () => {
    switch (resumo.status) {
      case 'enviado':
        return (
          <Badge className={badgeColor}>
            {variant === 'publica' ? 'Enviado' : 'Gerado'}
          </Badge>
        );
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cyber-card max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header fixo */}
        <div className="flex-shrink-0 p-6 pb-0">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-6">
              <div className="flex items-center gap-2 min-w-0">
                <Users className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                <DialogTitle className="truncate">
                  {resumo.grupo_nome}
                </DialogTitle>
              </div>
              {getStatusBadge()}
            </div>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(resumo.data_criacao)}</span>
            </div>
            {resumo.total_mensagens > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>{resumo.total_mensagens} mensagens</span>
              </div>
            )}
            {resumo.data_envio && (
              <div className="flex items-center gap-1.5 text-green-400">
                <span>Enviado em {formatDate(resumo.data_envio)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Conteudo com scroll */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 pt-4">
            {resumo.erro_msg && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm mb-4">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-400">{resumo.erro_msg}</span>
              </div>
            )}

            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed m-0">
                {resumo.conteudo}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ResumoModal;
