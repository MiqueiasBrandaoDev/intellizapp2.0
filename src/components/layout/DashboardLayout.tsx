import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEvolutionGroupsContext } from '@/contexts/EvolutionGroupsContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
  Smartphone,
  Crown,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Globe,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const DashboardLayout = () => {
  const { profile, signOut, isAuthenticated } = useAuth();
  const { isConnected } = useEvolutionGroupsContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gruposMenuOpen, setGruposMenuOpen] = useState(
    location.pathname.includes('/grupos') ||
    location.pathname.includes('/ia-publica') ||
    location.pathname.includes('/ia-oculta')
  );

  // Redirecionar usuarios sem plano ativo para pagina Meu Plano
  useEffect(() => {
    if (profile && !profile.plano_ativo && location.pathname !== '/dashboard/meu-plano') {
      navigate('/dashboard/meu-plano', { replace: true });
    }
  }, [profile, location.pathname, navigate]);

  // Abrir menu Grupos automaticamente quando navegar para subrotas
  useEffect(() => {
    if (
      location.pathname.includes('/ia-publica') ||
      location.pathname.includes('/ia-oculta')
    ) {
      setGruposMenuOpen(true);
    }
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const navigation = [
    { name: 'Conexao', href: '/dashboard/conexao', icon: Smartphone, requiresActivePlan: true },
    { name: 'Configuracoes', href: '/dashboard/settings', icon: Settings, requiresActivePlan: true },
    { name: 'Meu Plano', href: '/dashboard/meu-plano', icon: Crown, requiresActivePlan: false },
  ];

  const gruposSubItems = [
    { name: 'IA Publica', href: '/dashboard/ia-publica', icon: Globe, color: 'text-blue-500' },
    { name: 'IA Oculta', href: '/dashboard/ia-oculta', icon: Eye, color: 'text-purple-500' },
  ];

  const intelliChatItem = { name: 'IntelliChat', href: '/dashboard/intellichat', icon: Sparkles, requiresActivePlan: true };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const isGruposActive =
    location.pathname.includes('/ia-publica') ||
    location.pathname.includes('/ia-oculta');

  return (
    <div className="min-h-screen bg-background cyber-grid overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 sm:w-60 lg:w-64 xl:w-72 bg-card cyber-border transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        pb-safe-area-inset-bottom
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold cyber-text">Intellizapp.IA</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActiveRoute('/dashboard') && location.pathname === '/dashboard'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>

            {/* Grupos - Menu com subitens */}
            {profile?.plano_ativo && (
              <Collapsible open={gruposMenuOpen} onOpenChange={setGruposMenuOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isGruposActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Users className="mr-3 h-5 w-5" />
                      Grupos
                    </div>
                    {gruposMenuOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {gruposSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`mr-3 h-4 w-4 ${item.color}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Outros itens de navegacao */}
            {navigation
              .filter(item => !item.requiresActivePlan || profile?.plano_ativo)
              .map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                const showDisconnectedAlert = item.name === 'Conexao' && !isConnected;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                      ${showDisconnectedAlert ? 'border border-yellow-500/50' : ''}
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {showDisconnectedAlert && (
                      <AlertTriangle className="ml-auto h-4 w-4 text-yellow-500 animate-pulse" />
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* IntelliChat - Destaque Especial */}
          {profile?.plano_ativo && (
            <div className="px-4 pb-4">
              <Link
                to={intelliChatItem.href}
                className={`
                  relative flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  border-2
                  ${isActiveRoute(intelliChatItem.href)
                    ? 'bg-primary/30 text-primary border-primary shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-[1.02]'
                    : 'text-primary border-primary/50 hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl" />
                <Sparkles className="mr-3 h-5 w-5 relative z-10 animate-pulse" />
                <span className="relative z-10 font-bold tracking-wide">{intelliChatItem.name}</span>
                <div className="ml-auto relative z-10 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              </Link>
            </div>
          )}

          {/* User info and logout */}
          <div className="border-t border-border p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground">{profile?.nome}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <div className="mt-2 flex items-center">
                <div className={`
                  w-2 h-2 rounded-full mr-2
                  ${profile?.plano_ativo ? 'bg-green-500' : 'bg-red-500'}
                `} />
                <span className="text-xs text-muted-foreground">
                  {profile?.plano_ativo ? 'Plano Ativo' : 'Plano Inativo'}
                </span>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 xl:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)] overflow-y-auto pb-safe-area-inset-bottom">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
