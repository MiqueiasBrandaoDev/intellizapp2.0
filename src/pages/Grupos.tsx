import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Search, 
  MessageCircle, 
  Calendar,
  MoreVertical,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGrupos } from '@/hooks/useGrupos';
import { useEvolutionGroupsContext } from '@/contexts/EvolutionGroupsContext';
import { Grupo } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

const Grupos = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvolutionGroup, setSelectedEvolutionGroup] = useState<{
    nome_grupo: string;
    grupo_id_externo: string;
    participantes: number;
  } | null>(null);
  const [evolutionSearchTerm, setEvolutionSearchTerm] = useState('');
  const [updatingGroups, setUpdatingGroups] = useState<Set<number>>(new Set());
  
  
  const {
    grupos,
    isLoading,
    error,
    refetch,
    updateGrupo,
    deleteGrupo,
    createGrupo,
    isUpdating,
    isDeleting,
    isCreating,
    createError
  } = useGrupos();

  // Usar contexto global para grupos da Evolution API
  const {
    evolutionGroups,
    isLoading: evolutionLoading,
    error: evolutionError,
    refetch: refetchEvolutionGroups
  } = useEvolutionGroupsContext();

  const filteredGroups = grupos.filter(grupo =>
    grupo.nome_grupo?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  // Filtrar grupos da Evolution API
  const filteredEvolutionGroups = evolutionGroups.filter(group =>
    group.nome_grupo?.toLowerCase().includes(evolutionSearchTerm.toLowerCase()) || false
  );

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      updateGrupo({ id, data: { resumo_ativo: !currentStatus } });
      
      toast({
        title: "Resumos atualizados",
        description: `Resumos automáticos ${!currentStatus ? 'ativados' : 'desativados'} com sucesso.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração de resumos."
      });
    } finally {
      setUpdatingGroups(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRemoveGroup = async (id: number) => {
    try {
      deleteGrupo(id);
      
      toast({
        title: "Grupo removido",
        description: "O grupo foi removido da lista com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o grupo."
      });
    }
  };

  const handleToggleTranscricao = async (id: number, currentStatus: boolean) => {
    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      updateGrupo({ id, data: { transcricao_ativa: !currentStatus } });
      
      toast({
        title: "Transcrição atualizada",
        description: `Transcrição de áudios ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração de transcrição."
      });
    } finally {
      setUpdatingGroups(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleLudico = async (id: number, currentStatus: boolean) => {
    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      updateGrupo({ id, data: { ludico: !currentStatus } });
      
      toast({
        title: "Modo lúdico atualizado",
        description: `Modo lúdico ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o modo lúdico."
      });
    } finally {
      setUpdatingGroups(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };


  const handleSyncGroups = async () => {
    setSyncing(true);
    try {
      await refetch();
      
      toast({
        title: "Lista atualizada",
        description: "A lista de grupos foi atualizada com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista de grupos."
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddGrupo = async () => {
    if (!user || !selectedEvolutionGroup) return;

    // Verificar limite de grupos antes de adicionar
    const maxGrupos = user.max_grupos || 0;
    const gruposAtuais = grupos.length;

    if (gruposAtuais >= maxGrupos) {
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Você já possui ${gruposAtuais} de ${maxGrupos} grupos permitidos. Upgrade seu plano para adicionar mais grupos.`
      });
      return;
    }

    createGrupo({
      nome_grupo: selectedEvolutionGroup.nome_grupo,
      grupo_id_externo: selectedEvolutionGroup.grupo_id_externo,
      usuario_id: user.id,
      ativo: true
    }, {
      onSuccess: () => {
        toast({
          title: "Grupo adicionado",
          description: "O grupo foi adicionado com sucesso."
        });
        setModalOpen(false);
        setSelectedEvolutionGroup(null);
        setEvolutionSearchTerm('');
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error?.message || "Não foi possível adicionar o grupo."
        });
      }
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('pt-BR');
  };

  const getTimeSince = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold cyber-text">Grupos WhatsApp</h1>
            <p className="text-muted-foreground">Carregando grupos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="cyber-card animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold cyber-text">Grupos WhatsApp</h1>
            <p className="text-muted-foreground text-red-400">Erro ao carregar grupos</p>
          </div>
          <Button onClick={() => refetch()} className="cyber-button">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold cyber-text">Grupos WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie os grupos conectados à sua instância
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">
              {grupos.length} de {user?.max_grupos || 0} grupos utilizados
            </span>
            <div className="flex-1 bg-muted rounded-full h-2 max-w-32">
              <div 
                className={`h-2 rounded-full transition-all ${
                  grupos.length >= (user?.max_grupos || 0) 
                    ? 'bg-red-500' 
                    : grupos.length >= (user?.max_grupos || 0) * 0.8 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (grupos.length / (user?.max_grupos || 1)) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncGroups}
            disabled={syncing}
            className="cyber-button"
          >
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Lista
              </>
            )}
          </Button>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="cyber-button-outline"
                disabled={grupos.length >= (user?.max_grupos || 0)}
                title={grupos.length >= (user?.max_grupos || 0) ? 'Limite de grupos atingido' : ''}
              >
                <Plus className="mr-2 h-4 w-4" />
                {grupos.length >= (user?.max_grupos || 0) ? 'Limite Atingido' : 'Adicionar Grupo'}
              </Button>
            </DialogTrigger>
            <DialogContent className="cyber-card max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Grupo do WhatsApp</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pb-4">
                {/* Alert fixo sobre carregamento */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">O carregamento dos grupos pode demorar alguns minutos</span>
                  </div>
                </div>
                {/* Busca nos grupos do WhatsApp */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Buscar grupos do WhatsApp
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={evolutionSearchTerm}
                      onChange={(e) => setEvolutionSearchTerm(e.target.value)}
                      placeholder="Digite o nome do grupo..."
                      className="pl-10 cyber-border"
                    />
                  </div>
                </div>

                {/* Lista de grupos do WhatsApp */}
                <div className="max-h-72 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {evolutionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Carregando grupos...
                    </div>
                  ) : evolutionError ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Erro ao carregar grupos do WhatsApp
                    </div>
                  ) : filteredEvolutionGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {evolutionSearchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo disponível'}
                    </div>
                  ) : (
                    filteredEvolutionGroups.map((group, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedEvolutionGroup?.grupo_id_externo === group.grupo_id_externo
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => setSelectedEvolutionGroup(group)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{group.nome_grupo}</div>
                            {/* <div className="text-xs text-muted-foreground">
                              {group.participantes} participantes
                            </div> */}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.grupo_id_externo?.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>


                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModalOpen(false);
                      setSelectedEvolutionGroup(null);
                      setEvolutionSearchTerm('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddGrupo}
                    disabled={!selectedEvolutionGroup || isCreating}
                    className="cyber-button"
                  >
                    {isCreating ? 'Adicionando...' : 'Adicionar Grupo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 cyber-border"
          />
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{grupos.filter(g => g.ativo).length} Ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>{grupos.filter(g => !g.ativo).length} Inativos</span>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((grupo) => (
          <Card key={grupo.id} className="cyber-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Users className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle 
                  className="text-lg truncate min-w-0" 
                  title={grupo.nome_grupo || 'Sem nome'}
                >
                  {grupo.nome_grupo || 'Sem nome'}
                </CardTitle>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="cyber-card">
                  <DropdownMenuItem 
                    onClick={() => handleRemoveGroup(grupo.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Configurações */}
              <div className="space-y-3">
                {isLoading || updatingGroups.has(grupo.id) ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Resumos ativos</span>
                      <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Transcrição de áudios</span>
                      <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Modo lúdico</span>
                      <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Resumos ativos</span>
                      <Switch
                        checked={grupo.resumo_ativo || false}
                        onCheckedChange={() => handleToggleActive(grupo.id, grupo.resumo_ativo)}
                        disabled={isUpdating || updatingGroups.has(grupo.id)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Transcrição de áudios</span>
                      <Switch
                        checked={grupo.transcricao_ativa || false}
                        onCheckedChange={() => handleToggleTranscricao(grupo.id, grupo.transcricao_ativa)}
                        disabled={isUpdating || updatingGroups.has(grupo.id)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Modo lúdico</span>
                      <Switch
                        checked={grupo.ludico || false}
                        onCheckedChange={() => handleToggleLudico(grupo.id, grupo.ludico)}
                        disabled={isUpdating || updatingGroups.has(grupo.id)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Criado em
                  </span>
                  <span className="font-medium">{formatDate(grupo.criado_em)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <Badge 
                  variant={grupo.ativo ? "default" : "secondary"}
                  className={grupo.ativo ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                >
                  {grupo.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                
                <span className="text-xs text-muted-foreground">
                  ID: {grupo.grupo_id_externo?.slice(0, 8) || 'N/A'}...
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <Card className="cyber-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm 
                ? 'Nenhum grupo corresponde à sua busca.'
                : 'Adicione grupos do WhatsApp para começar.'
              }
            </p>
            {!searchTerm && (
              <Button 
                className="cyber-button"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Grupos
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Grupos;