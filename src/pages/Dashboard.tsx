import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useRecentActivity, useSystemInsights } from '@/hooks/useDashboard';
import {
  Users,
  FileText,
  Clock,
  Activity,
  Bot,
  Zap,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  } catch {
    return '';
  }
};

const Dashboard = () => {
  const { profile } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: insights, isLoading: insightsLoading } = useSystemInsights();

  // Calcular ResumeCoins
  const coinsDisponiveis = Math.floor((profile?.tokens_mes || 0) / 1000);

  return (
    <div className="relative min-h-full">
      <div className="space-y-8">
        {/* Header com Greeting */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Olá, <span className="cyber-text">{profile?.nome?.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground">
              Aqui está o que está acontecendo com seus grupos hoje.
            </p>
          </div>

          {/* Quick Actions + ResumeCoins Tag */}
          <div className="flex items-center gap-3">
            {/* ResumeCoins Tag */}
            <Link
              to="/dashboard/meu-plano"
              className="glass-pill flex items-center gap-2 text-sm hover:bg-yellow-500/20 transition-all cursor-pointer border-yellow-500/30"
            >
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-yellow-500">{coinsDisponiveis.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">coins</span>
            </Link>
            <Link
              to="/dashboard/intellichat"
              className="glass-pill flex items-center gap-2 text-sm hover:bg-white/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              ResumeChat
            </Link>
            <Link
              to="/dashboard/ia-publica"
              className="glass-pill flex items-center gap-2 text-sm hover:bg-white/20 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-secondary" />
              Grupos
            </Link>
          </div>
        </div>

        {/* Main Stats - Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Grupos - Large Card */}
          <div className="col-span-2 glass-card-hover p-6 glass-glow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total de Grupos</p>
                {statsLoading ? (
                  <Skeleton className="h-12 w-24" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold stat-number">{stats?.totalGroups || 0}</span>
                    <span className="text-muted-foreground">/ {profile?.max_grupos || 0}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.activeGroups || 0} ativos agora
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Mini Progress */}
            <div className="mt-4">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                  style={{ width: `${((stats?.totalGroups || 0) / (profile?.max_grupos || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resumos Enviados */}
          <div className="glass-card-hover p-5 glass-glow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              {stats?.resumosHoje ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  +{stats.resumosHoje} hoje
                </Badge>
              ) : null}
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold stat-number">{stats?.totalResumes || 0}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Resumos enviados</p>
          </div>

          {/* Mensagens Processadas */}
          <div className="glass-card-hover p-5 glass-glow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              {stats?.mensagensHoje ? (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  +{stats.mensagensHoje}
                </Badge>
              ) : null}
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold stat-number">
                {(stats?.messagesProcessed || 0).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Mensagens lidas</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Atividade Recente - Maior */}
          <div className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Atividade Recente</h2>
                  <p className="text-xs text-muted-foreground">Últimos resumos enviados</p>
                </div>
              </div>
              <Link
                to="/dashboard/ia-publica"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !recentActivity?.length ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Nenhuma atividade ainda</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os resumos aparecerão aqui quando forem gerados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="glass-stat p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        {activity.status === 'enviado' && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {activity.grupo_nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.total_mensagens && `${activity.total_mensagens} mensagens • `}
                          {formatTimeAgo(activity.data_envio)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        activity.status === 'enviado'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : activity.status === 'erro'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }
                    >
                      {activity.status === 'enviado' ? 'Enviado' :
                       activity.status === 'erro' ? 'Erro' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights - Menor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status do Sistema */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5">
                  <Bot className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="font-semibold">Status</h2>
                  <p className="text-xs text-muted-foreground">Sua conta</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Plano */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${profile?.plano_ativo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm">Plano</span>
                  </div>
                  <Badge variant="outline" className={profile?.plano_ativo ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}>
                    {profile?.plano_ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {/* Instância */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm">Instância</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {profile?.instancia || 'Não config.'}
                  </span>
                </div>

                {/* Hora do Resumo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span className="text-sm">Próximo resumo</span>
                  </div>
                  <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                    {profile?.horaResumo || '09:00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold">Insights</h2>
                  <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
                </div>
              </div>

              {insightsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grupo mais ativo */}
                  {insights?.mostActiveGroup && (
                    <div className="glass-stat p-3">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Mais ativo</p>
                          <p className="text-sm font-medium truncate">{insights.mostActiveGroup}</p>
                        </div>
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                          {insights.mostActiveGroupMessages} msg
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Média diária */}
                  <div className="glass-stat p-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Média diária</p>
                        <p className="text-sm font-medium">{insights?.avgMessagesPerDay || 0} mensagens/dia</p>
                      </div>
                    </div>
                  </div>

                  {/* Último resumo */}
                  {insights?.lastResumeTime && (
                    <div className="glass-stat p-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Último resumo</p>
                          <p className="text-sm font-medium truncate">{insights.lastResumeGroup}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Footer */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Configurações</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link
              to="/dashboard/conexao"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Conexão WhatsApp</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link
              to="/dashboard/meu-plano"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Meu Plano</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
