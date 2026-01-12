import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowRightLeft } from 'lucide-react';

interface TransferGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  fromIA: 'Pública' | 'Oculta';
  toIA: 'Pública' | 'Oculta';
  onConfirm: () => void;
}

export const TransferGroupDialog: React.FC<TransferGroupDialogProps> = ({
  open,
  onOpenChange,
  groupName,
  fromIA,
  toIA,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="cyber-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transferir Grupo
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="text-base">
              O grupo <span className="font-semibold text-foreground">"{groupName}"</span> já está cadastrado na{' '}
              <span className="font-semibold text-foreground">IA {fromIA}</span>.
            </p>
            <p>
              Deseja transferi-lo para a{' '}
              <span className="font-semibold text-foreground">IA {toIA}</span>?
            </p>
            <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
              <p className="font-medium text-foreground">O que acontecerá:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>O grupo será removido da IA {fromIA}</li>
                <li>O grupo será adicionado à IA {toIA}</li>
                <li>Todas as configurações serão mantidas</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="cyber-button">
            Transferir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
