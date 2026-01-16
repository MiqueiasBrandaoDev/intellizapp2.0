import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Search,
  FileText,
  Plus,
  Calendar,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/ios-spinner';
import { TransferGroupDialog } from '@/components/TransferGroupDialog';
import { useToast } from '@/hooks/use-toast';
import { useIAOcultaGrupos, useCheckGrupoExists } from '@/hooks/useIAGrupos';
import { useEvolutionGroupsContext } from '@/contexts/EvolutionGroupsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResumosIAOculta } from '@/hooks/useResumos';
import { ResumoModal } from '@/components/ResumoModal';
import { Grupo, CreateGrupoData, ResumoWithGrupo } from '@/types/database';

const IAOculta = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [resumoSearchTerm, setResumoSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
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

  // Estado para modal de resumo expandido
  const [selectedResumo, setSelectedResumo] = useState<ResumoWithGrupo | null>(null);
  const [resumoModalOpen, setResumoModalOpen] = useState(false);

  // Buscar resumos da IA Oculta (iaoculta = true)
  const {
    resumos,
    isLoading: resumosLoading,
    refetch: refetchResumos
  } = useResumosIAOculta(1, 50, resumoSearchTerm);

  const {
    grupos: iaOcultaGroups,
    isLoading,
    error,
    refetch,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    isCreating,
    isUpdating,
  } = useIAOcultaGrupos();

  const { checkGrupoExists } = useCheckGrupoExists();

  const {
    evolutionGroups,
    isLoading: evolutionLoading,
    error: evolutionError,
    isRetrying: evolutionRetrying
  } = useEvolutionGroupsContext();

  // IDs dos grupos ja adicionados na IA Oculta
  const iaOcultaGroupIds = new Set(iaOcultaGroups.map(g => g.grupo_id_externo));

  // Grupos filtrados na IA Oculta
  const filteredIAOcultaGroups = iaOcultaGroups.filter(grupo =>
    grupo.nome_grupo?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  // Grupos disponiveis para adicionar (da Evolution API, que nao estao na IA Oculta)
  const availableGroups = evolutionGroups.filter(g => !iaOcultaGroupIds.has(g.grupo_id_externo));
  const filteredAvailableGroups = availableGroups.filter(grupo =>
    grupo.nome_grupo?.toLowerCase().includes(modalSearchTerm.toLowerCase()) || false
  );

  const handleAddGroup = async (grupo: { nome_grupo: string; grupo_id_externo: string; participantes: number }) => {
    // Protecao contra cliques multiplos
    if (addingGroupId) return;

    setAddingGroupId(grupo.grupo_id_externo);

    try {
      // Verificar se o grupo ja existe em alguma IA
      const checkResult = await checkGrupoExists(grupo.grupo_id_externo);

      if (checkResult.exists && checkResult.grupo) {
        // Grupo existe
        if (!checkResult.isOculta) {
          // Grupo esta na IA Publica, perguntar se quer transferir
          setTransferDialog({
            open: true,
            group: grupo,
            existingGrupo: checkResult.grupo
          });
          setAddingGroupId(null);
        } else {
          // Grupo ja esta na IA Oculta
          toast({
            variant: "destructive",
            title: "Grupo ja cadastrado",
            description: "Este grupo ja esta na IA Oculta."
          });
          setAddingGroupId(null);
        }
      } else {
        // Grupo nao existe, criar novo
        // IMPORTANTE: Garantir que iaoculta seja true
        const novoGrupo: CreateGrupoData = {
          nome_grupo: grupo.nome_grupo,
          grupo_id_externo: grupo.grupo_id_externo,
          usuario_id: profile!.id,
          ativo: true,
          iaoculta: true  // CRÍTICO: IA Oculta deve ter iaoculta = true
        };
        console.log('🔵 [IA Oculta] Criando novo grupo COM IAOCULTA TRUE:', novoGrupo);
        console.log('🔵 [IA Oculta] Valor de iaoculta:', novoGrupo.iaoculta);

        createGrupo(novoGrupo, {
          onSuccess: () => {
            toast({
              title: "Grupo adicionado",
              description: `${grupo.nome_grupo} adicionado a IA Oculta.`
            });
            setModalOpen(false);
            setModalSearchTerm('');
            setAddingGroupId(null);
            refetch(); // Força refetch para atualizar lista
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

    // Atualizar o grupo para iaoculta = true (transferir para IA Oculta)
    updateGrupo({
      id: transferDialog.existingGrupo.id,
      data: { iaoculta: true }
    }, {
      onSuccess: () => {
        toast({
          title: "Grupo transferido",
          description: `${transferDialog.group?.nome_grupo} foi transferido para a IA Oculta.`
        });
        setTransferDialog({ open: false, group: null, existingGrupo: null });
        setModalOpen(false);
        setModalSearchTerm('');
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

  const handleRemoveGroup = (id: string) => {
    deleteGrupo(id);
    toast({
      title: "Grupo removido",
      description: "Grupo removido da IA Oculta."
    });
  };

  const handleToggleLudico = (id: string, currentStatus: boolean) => {
    updateGrupo(
      { id, data: { ludico: !currentStatus } },
      {
        onSuccess: () => {
          toast({
            title: "Estilo do resumo atualizado",
            description: `Resumo ${!currentStatus ? 'descontraído' : 'formal'} ativado com sucesso.`
          });
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error?.message || "Não foi possível atualizar."
          });
        }
      }
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold cyber-text flex items-center gap-3">
            <Eye className="h-8 w-8 text-purple-500" />
            IA Oculta
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
            <Eye className="h-8 w-8 text-purple-500" />
            IA Oculta
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
          <Eye className="h-8 w-8 text-purple-500" />
          IA Oculta
        </h1>
        <p className="text-muted-foreground">
          Os resumos destes grupos serao exibidos somente aqui no sistema
        </p>
      </div>

      {/* Dialog de Transferencia */}
      <TransferGroupDialog
        open={transferDialog.open}
        onOpenChange={(open) => setTransferDialog({ ...transferDialog, open })}
        groupName={transferDialog.group?.nome_grupo || ''}
        fromIA="Pública"
        toIA="Oculta"
        onConfirm={handleConfirmTransfer}
      />

      {/* Tabs */}
      <Tabs defaultValue="grupos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="grupos" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Grupos ({iaOcultaGroups.length})
          </TabsTrigger>
          <TabsTrigger value="resumos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resumos ({resumos.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba de Grupos */}
        <TabsContent value="grupos" className="space-y-4 mt-6">
          {/* Header com acoes */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {iaOcultaGroups.length} grupos monitorados
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="cyber-card max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Grupo a IA Oculta</DialogTitle>
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
                    Selecione um grupo do WhatsApp para monitorar. Os resumos serao gerados automaticamente.
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
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
                    ) : filteredAvailableGroups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {modalSearchTerm
                          ? 'Nenhum grupo encontrado'
                          : availableGroups.length === 0 && evolutionGroups.length > 0
                            ? 'Todos os grupos ja estao na IA Oculta'
                            : 'Nenhum grupo disponivel no WhatsApp'
                        }
                      </div>
                    ) : addingGroupId ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Spinner size="lg" />
                        <span className="text-sm text-muted-foreground">Verificando grupo...</span>
                      </div>
                    ) : (
                      filteredAvailableGroups.map((grupo, index) => (
                        <div
                          key={grupo.grupo_id_externo || index}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            addingGroupId === grupo.grupo_id_externo
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/30'
                          }`}
                          onClick={() => handleAddGroup(grupo)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="font-medium">{grupo.nome_grupo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {grupo.grupo_id_externo?.slice(0, 8)}...
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

          {/* Busca */}
          {iaOcultaGroups.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Grid de Grupos */}
          {filteredIAOcultaGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIAOcultaGroups.map((grupo) => (
                <Card key={grupo.id} className="cyber-card">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      <h3 className="font-semibold truncate">{grupo.nome_grupo}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveGroup(grupo.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Adicionado em
                      </span>
                      <span className="font-medium">{formatDate(grupo.criado_em)}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Resumo Descontraído</span>
                        <span className="text-xs text-muted-foreground">
                          {grupo.ludico ? 'Tom divertido e informal' : 'Tom sério e formal'}
                        </span>
                      </div>
                      <Switch
                        checked={Boolean(grupo.ludico)}
                        onCheckedChange={() => handleToggleLudico(grupo.id, Boolean(grupo.ludico))}
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                        Monitorando
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
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo monitorado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm
                    ? 'Nenhum grupo corresponde a busca.'
                    : 'Adicione grupos para comecar o monitoramento silencioso.'
                  }
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
          {/* Header com acoes */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar resumos..."
                value={resumoSearchTerm}
                onChange={(e) => setResumoSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => refetchResumos()} variant="outline" disabled={resumosLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${resumosLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Lista de Resumos */}
          {resumosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="cyber-card animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-16 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resumos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumos.map((resumo) => (
                <Card
                  key={resumo.id}
                  className="cyber-card cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                  onClick={() => {
                    setSelectedResumo(resumo);
                    setResumoModalOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="font-medium truncate max-w-48">{resumo.grupo_nome}</span>
                      </div>
                      <Badge
                        variant={resumo.status === 'enviado' ? 'default' : resumo.status === 'erro' ? 'destructive' : 'secondary'}
                        className={resumo.status === 'enviado' ? 'bg-purple-500/20 text-purple-400' : ''}
                      >
                        {resumo.status === 'enviado' ? 'Gerado' : resumo.status === 'erro' ? 'Erro' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(resumo.data_criacao)}
                      {resumo.total_mensagens > 0 && (
                        <span className="ml-2">• {resumo.total_mensagens} mensagens</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {resumo.conteudo}
                    </p>
                    {resumo.erro_msg && (
                      <p className="text-xs text-red-400 mt-2">
                        Erro: {resumo.erro_msg}
                      </p>
                    )}
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
                    : iaOcultaGroups.length === 0
                      ? 'Adicione grupos para gerar resumos.'
                      : 'Os resumos serao gerados automaticamente e exibidos apenas aqui.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Resumo Expandido */}
      <ResumoModal
        resumo={selectedResumo}
        open={resumoModalOpen}
        onOpenChange={setResumoModalOpen}
        variant="oculta"
      />
    </div>
  );
};

export default IAOculta;
