import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  MoreVertical,
  Trash2,
  Globe,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/ios-spinner';
import { TransferGroupDialog } from '@/components/TransferGroupDialog';
import { useIAPublicaGrupos, useCheckGrupoExists } from '@/hooks/useIAGrupos';
import { useEvolutionGroupsContext } from '@/contexts/EvolutionGroupsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Grupo } from '@/types/database';

// Tipo para resumo da IA Publica
interface ResumoPublico {
  id: string;
  grupo_id: string;
  grupo_nome: string;
  conteudo: string;
  criado_em: string;
}

const IAPublica = () => {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [resumoSearchTerm, setResumoSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [evolutionSearchTerm, setEvolutionSearchTerm] = useState('');
  const [updatingGroups, setUpdatingGroups] = useState<Set<string>>(new Set());
  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);

  // Estado para dialog de transferencia
  const [transferDialog, setTransferDialog] = useState<{
    open: boolean;
    group: { nome_grupo: string; grupo_id_externo: string; participantes: number } | null;
    existingGrupo: Grupo | null;
  }>({
    open: false,
    group: null,
    existingGrupo: null
  });

  // Mock de resumos (depois conectar ao backend)
  const [resumos] = useState<ResumoPublico[]>([]);

  const {
    grupos,
    isLoading,
    error,
    refetch,
    updateGrupo,
    deleteGrupo,
    createGrupo,
    isUpdating,
    isCreating,
  } = useIAPublicaGrupos();

  const { checkGrupoExists } = useCheckGrupoExists();

  useEffect(() => {
    if (!isLoading && !isUpdating) {
      setUpdatingGroups(new Set());
    }
  }, [isLoading, isUpdating]);

  const {
    evolutionGroups,
    isLoading: evolutionLoading,
    error: evolutionError,
    isRetrying: evolutionRetrying
  } = useEvolutionGroupsContext();

  const filteredGroups = grupos.filter(grupo =>
    grupo.nome_grupo?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const filteredEvolutionGroups = evolutionGroups.filter(group =>
    group.nome_grupo?.toLowerCase().includes(evolutionSearchTerm.toLowerCase()) || false
  );

  // Resumos filtrados
  const filteredResumos = resumos.filter(resumo =>
    resumo.grupo_nome?.toLowerCase().includes(resumoSearchTerm.toLowerCase()) ||
    resumo.conteudo?.toLowerCase().includes(resumoSearchTerm.toLowerCase()) ||
    false
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (updatingGroups.has(id)) return;

    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      await new Promise((resolve, reject) => {
        updateGrupo({ id, data: { resumo_ativo: !currentStatus } }, {
          onSuccess: () => {
            toast({
              title: "Resumos atualizados",
              description: `Resumos automaticos ${!currentStatus ? 'ativados' : 'desativados'} com sucesso.`
            });
            resolve(true);
          },
          onError: (error: any) => {
            toast({
              variant: "destructive",
              title: "Erro",
              description: error?.message || "Nao foi possivel atualizar."
            });
            reject(error);
          }
        });
      });
    } finally {
      setTimeout(() => {
        setUpdatingGroups(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    }
  };

  const handleToggleTranscricao = async (id: string, currentStatus: boolean) => {
    if (updatingGroups.has(id)) return;

    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      await new Promise((resolve, reject) => {
        updateGrupo({ id, data: { transcricao_ativa: !currentStatus } }, {
          onSuccess: () => {
            toast({
              title: "Transcricao atualizada",
              description: `Transcricao ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`
            });
            resolve(true);
          },
          onError: (error: any) => {
            toast({
              variant: "destructive",
              title: "Erro",
              description: error?.message || "Nao foi possivel atualizar."
            });
            reject(error);
          }
        });
      });
    } finally {
      setTimeout(() => {
        setUpdatingGroups(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    }
  };

  const handleToggleLudico = async (id: string, currentStatus: boolean) => {
    if (updatingGroups.has(id)) return;

    setUpdatingGroups(prev => new Set(prev).add(id));
    try {
      await new Promise((resolve, reject) => {
        updateGrupo({ id, data: { ludico: !currentStatus } }, {
          onSuccess: () => {
            toast({
              title: "Estilo do resumo atualizado",
              description: `Resumo ${!currentStatus ? 'descontraído' : 'formal'} ativado com sucesso.`
            });
            resolve(true);
          },
          onError: (error: any) => {
            toast({
              variant: "destructive",
              title: "Erro",
              description: error?.message || "Nao foi possivel atualizar."
            });
            reject(error);
          }
        });
      });
    } finally {
      setTimeout(() => {
        setUpdatingGroups(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    }
  };

  const handleRemoveGroup = async (id: string) => {
    try {
      deleteGrupo(id);
      toast({
        title: "Grupo removido",
        description: "O grupo foi removido com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nao foi possivel remover o grupo."
      });
    }
  };

  const handleSyncGroups = async () => {
    setSyncing(true);
    try {
      await refetch();
      toast({
        title: "Lista atualizada",
        description: "A lista de grupos foi atualizada."
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddGrupoDirectly = async (group: { nome_grupo: string; grupo_id_externo: string; participantes: number }) => {
    // Protecao contra cliques multiplos
    if (!user || !profile || addingGroupId) return;

    const maxGrupos = profile?.max_grupos || 0;
    if (grupos.length >= maxGrupos) {
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Voce possui ${grupos.length} de ${maxGrupos} grupos.`
      });
      return;
    }

    // Marcar que estamos verificando/adicionando este grupo
    setAddingGroupId(group.grupo_id_externo);

    try {
      // Verificar se o grupo ja existe em alguma IA
      const checkResult = await checkGrupoExists(group.grupo_id_externo);

      if (checkResult.exists && checkResult.grupo) {
        // Grupo existe
        if (checkResult.isOculta) {
          // Grupo esta na IA Oculta, perguntar se quer transferir
          setTransferDialog({
            open: true,
            group,
            existingGrupo: checkResult.grupo
          });
          setAddingGroupId(null);
        } else {
          // Grupo ja esta na IA Publica
          toast({
            variant: "destructive",
            title: "Grupo ja cadastrado",
            description: "Este grupo ja esta na IA Publica."
          });
          setAddingGroupId(null);
        }
      } else {
        // Grupo nao existe, criar novo
        const novoGrupo = {
          nome_grupo: group.nome_grupo,
          grupo_id_externo: group.grupo_id_externo,
          usuario_id: profile.id,
          ativo: true,
          iaoculta: false
        };
        console.log('🟢 [IA Pública] Criando novo grupo:', novoGrupo);
        createGrupo(novoGrupo, {
          onSuccess: () => {
            toast({
              title: "Grupo adicionado",
              description: `${group.nome_grupo} adicionado a IA Publica.`
            });
            setModalOpen(false);
            setEvolutionSearchTerm('');
            setAddingGroupId(null);
          },
          onError: (error: any) => {
            toast({
              variant: "destructive",
              title: "Erro",
              description: error?.message || "Nao foi possivel adicionar."
            });
            setAddingGroupId(null);
          }
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nao foi possivel verificar o grupo."
      });
      setAddingGroupId(null);
    }
  };

  const handleConfirmTransfer = () => {
    if (!transferDialog.existingGrupo) return;

    // Atualizar o grupo para iaoculta = false (transferir para IA Publica)
    updateGrupo({
      id: transferDialog.existingGrupo.id,
      data: { iaoculta: false }
    }, {
      onSuccess: () => {
        toast({
          title: "Grupo transferido",
          description: `${transferDialog.group?.nome_grupo} foi transferido para a IA Publica.`
        });
        setTransferDialog({ open: false, group: null, existingGrupo: null });
        setModalOpen(false);
        setEvolutionSearchTerm('');
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error?.message || "Nao foi possivel transferir o grupo."
        });
      }
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold cyber-text flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-500" />
            IA Publica
          </h1>
          <p className="text-muted-foreground">Carregando grupos...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="cyber-card animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
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
        <div>
          <h1 className="text-3xl font-bold cyber-text flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-500" />
            IA Publica
          </h1>
          <p className="text-red-400">Erro ao carregar grupos</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold cyber-text flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-500" />
          IA Publica
        </h1>
        <p className="text-muted-foreground">
          Os resumos destes grupos serao enviados diretamente no grupo do WhatsApp
        </p>
      </div>

      {/* Dialog de Transferencia */}
      <TransferGroupDialog
        open={transferDialog.open}
        onOpenChange={(open) => setTransferDialog({ ...transferDialog, open })}
        groupName={transferDialog.group?.nome_grupo || ''}
        fromIA="Oculta"
        toIA="Pública"
        onConfirm={handleConfirmTransfer}
      />

      {/* Tabs */}
      <Tabs defaultValue="grupos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="grupos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Grupos ({grupos.length})
          </TabsTrigger>
          <TabsTrigger value="resumos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumos ({resumos.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba de Grupos */}
        <TabsContent value="grupos" className="space-y-4 mt-6">
          {/* Header com acoes */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {grupos.length} de {profile?.max_grupos || 0} grupos
              </span>
              <div className="flex-1 bg-muted rounded-full h-2 max-w-32">
                <div
                  className={`h-2 rounded-full transition-all ${
                    grupos.length >= (profile?.max_grupos || 0)
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (grupos.length / (profile?.max_grupos || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSyncGroups} disabled={syncing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button disabled={grupos.length >= (profile?.max_grupos || 0)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent className="cyber-card max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Grupo a IA Publica</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pb-4">
                    {/* Alert sobre carregamento */}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">O carregamento dos grupos pode demorar alguns minutos</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Selecione um grupo do WhatsApp para adicionar. Os resumos serao enviados diretamente no grupo.
                    </p>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={evolutionSearchTerm}
                        onChange={(e) => setEvolutionSearchTerm(e.target.value)}
                        placeholder="Buscar grupo..."
                        className="pl-10"
                      />
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 border rounded-lg p-2">
                      {evolutionLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          {evolutionRetrying ? 'Tentando novamente...' : 'Carregando grupos do WhatsApp...'}
                        </div>
                      ) : evolutionError ? (
                        <div className="text-center py-8 space-y-2">
                          <div className="text-muted-foreground">
                            Erro ao carregar grupos do WhatsApp
                          </div>
                          {evolutionRetrying && (
                            <div className="flex items-center justify-center text-sm text-blue-500">
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                              Tentando novamente...
                            </div>
                          )}
                        </div>
                      ) : filteredEvolutionGroups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {evolutionSearchTerm
                            ? 'Nenhum grupo encontrado'
                            : evolutionGroups.length === 0
                              ? 'Nenhum grupo disponivel no WhatsApp'
                              : 'Nenhum grupo encontrado'
                          }
                        </div>
                      ) : addingGroupId ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                          <Spinner size="lg" />
                          <span className="text-sm text-muted-foreground">Verificando grupo...</span>
                        </div>
                      ) : (
                        filteredEvolutionGroups.map((group, index) => (
                          <div
                            key={group.grupo_id_externo || index}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              addingGroupId === group.grupo_id_externo
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/30'
                            }`}
                            onClick={() => handleAddGrupoDirectly(group)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium">{group.nome_grupo}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {group.grupo_id_externo?.slice(0, 8)}...
                                </span>
                                <Plus className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Busca */}
          {grupos.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
          )}

          {/* Grid de Grupos */}
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((grupo) => (
                <Card key={grupo.id} className="cyber-card">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <h3 className="font-semibold truncate" title={grupo.nome_grupo || 'Sem nome'}>
                        {grupo.nome_grupo || 'Sem nome'}
                      </h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveGroup(grupo.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-3">
                      {updatingGroups.has(grupo.id) ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                              <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Resumos ativos</span>
                            <Switch
                              checked={Boolean(grupo.resumo_ativo)}
                              onCheckedChange={() => handleToggleActive(grupo.id, Boolean(grupo.resumo_ativo))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Transcricao</span>
                            <Switch
                              checked={Boolean(grupo.transcricao_ativa)}
                              onCheckedChange={() => handleToggleTranscricao(grupo.id, Boolean(grupo.transcricao_ativa))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">Resumo Descontraído</span>
                              <span className="text-xs text-muted-foreground">
                                {grupo.ludico ? 'Tom divertido e informal' : 'Tom sério e formal'}
                              </span>
                            </div>
                            <Switch
                              checked={Boolean(grupo.ludico)}
                              onCheckedChange={() => handleToggleLudico(grupo.id, Boolean(grupo.ludico))}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Criado em
                      </span>
                      <span className="font-medium">{formatDate(grupo.criado_em)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge
                        variant={grupo.ativo ? "default" : "secondary"}
                        className={grupo.ativo ? "bg-green-500/20 text-green-400" : ""}
                      >
                        {grupo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ID: {grupo.grupo_id_externo?.slice(0, 8)}...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="cyber-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? 'Nenhum grupo corresponde a busca.' : 'Adicione grupos para comecar.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Grupo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Resumos */}
        <TabsContent value="resumos" className="space-y-4 mt-6">
          {/* Busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar resumos..."
              value={resumoSearchTerm}
              onChange={(e) => setResumoSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Resumos */}
          {filteredResumos.length > 0 ? (
            <div className="space-y-4">
              {filteredResumos.map((resumo) => (
                <Card key={resumo.id} className="cyber-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{resumo.grupo_nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(resumo.criado_em)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {resumo.conteudo}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="cyber-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum resumo</h3>
                <p className="text-muted-foreground text-center">
                  {resumoSearchTerm
                    ? 'Nenhum resumo corresponde a busca.'
                    : grupos.length === 0
                      ? 'Adicione grupos para gerar resumos.'
                      : 'Os resumos serao gerados automaticamente e enviados no grupo.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IAPublica;
