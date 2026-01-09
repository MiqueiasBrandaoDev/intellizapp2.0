import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useEvolutionGroupsContext } from '@/contexts/EvolutionGroupsContext';

// Tipo para grupo da Evolution API
interface EvolutionGroup {
  nome_grupo: string;
  grupo_id_externo: string;
  usuario_id: string;
  ativo: boolean;
  participantes: number;
  descricao: string | null;
}

// Tipo para grupo adicionado na IA Oculta
interface IAOcultaGroup extends EvolutionGroup {
  adicionado_em: string;
}

// Mock de resumos para IA Oculta (depois conectar ao backend)
interface ResumoOculto {
  id: string;
  grupo_id: string;
  grupo_nome: string;
  conteudo: string;
  criado_em: string;
}

const IAOculta = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [resumoSearchTerm, setResumoSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);

  // Estado local para grupos da IA Oculta (usando grupo_id_externo como identificador)
  const [iaOcultaGroups, setIaOcultaGroups] = useState<IAOcultaGroup[]>([]);

  // Mock de resumos
  const [resumos] = useState<ResumoOculto[]>([]);

  // Usar grupos da Evolution API (WhatsApp)
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

  // Resumos filtrados
  const filteredResumos = resumos.filter(resumo =>
    resumo.grupo_nome?.toLowerCase().includes(resumoSearchTerm.toLowerCase()) ||
    resumo.conteudo?.toLowerCase().includes(resumoSearchTerm.toLowerCase()) ||
    false
  );

  const handleAddGroup = (grupo: EvolutionGroup) => {
    // Protecao contra cliques multiplos
    if (addingGroupId) return;

    setAddingGroupId(grupo.grupo_id_externo);

    // Simular um pequeno delay para mostrar o loading (na versao real, seria uma chamada API)
    setTimeout(() => {
      const newGroup: IAOcultaGroup = {
        ...grupo,
        adicionado_em: new Date().toISOString()
      };
      setIaOcultaGroups(prev => [...prev, newGroup]);
      setModalOpen(false);
      setModalSearchTerm('');
      setAddingGroupId(null);
      toast({
        title: "Grupo adicionado",
        description: `${grupo.nome_grupo} adicionado a IA Oculta.`
      });
    }, 500);
  };

  const handleRemoveGroup = (grupoIdExterno: string) => {
    setIaOcultaGroups(prev => prev.filter(g => g.grupo_id_externo !== grupoIdExterno));
    toast({
      title: "Grupo removido",
      description: "Grupo removido da IA Oculta."
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                        <span className="text-sm text-muted-foreground">Adicionando grupo...</span>
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
                <Card key={grupo.grupo_id_externo} className="cyber-card">
                  <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      <h3 className="font-semibold truncate">{grupo.nome_grupo}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveGroup(grupo.grupo_id_externo)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Adicionado
                      </span>
                      <span className="font-medium">
                        {new Date(grupo.adicionado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge className="bg-purple-500/20 text-purple-400">
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
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo na IA Oculta</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Adicione grupos do WhatsApp para monitorar silenciosamente.
                </p>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Grupo
                </Button>
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
                        <Users className="h-4 w-4 text-purple-500" />
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
                    : iaOcultaGroups.length === 0
                      ? 'Adicione grupos para gerar resumos.'
                      : 'Os resumos serao gerados automaticamente.'
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

export default IAOculta;
