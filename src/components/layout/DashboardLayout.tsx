import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
  Smartphone,
  Crown,
  Shield,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const DashboardLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirecionar usuários sem plano ativo para página Meu Plano
  useEffect(() => {
    if (user && !user.plano_ativo && location.pathname !== '/dashboard/meu-plano') {
      navigate('/dashboard/meu-plano', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresActivePlan: true },
    { name: 'Grupos', href: '/dashboard/grupos', icon: Users, requiresActivePlan: true },
    { name: 'Resumos', href: '/dashboard/resumos', icon: FileText, requiresActivePlan: true },
    { name: 'Conexão', href: '/dashboard/conexao', icon: Smartphone, requiresActivePlan: true },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings, requiresActivePlan: true },
    { name: 'Meu Plano', href: '/dashboard/meu-plano', icon: Crown, requiresActivePlan: false },
  ];

  const intelliChatItem = { name: 'IntelliChat', href: '/dashboard/intellichat', icon: Sparkles, requiresActivePlan: true };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
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
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation
              .filter(item => !item.requiresActivePlan || user?.plano_ativo)
              .map((item) => {
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
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* IntelliChat - Destaque Especial */}
          {user?.plano_ativo && (
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
              <p className="text-sm font-medium text-foreground">{user?.nome}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex items-center">
                <div className={`
                  w-2 h-2 rounded-full mr-2
                  ${user?.plano_ativo ? 'bg-green-500' : 'bg-red-500'}
                `} />
                <span className="text-xs text-muted-foreground">
                  {user?.plano_ativo ? 'Plano Ativo' : 'Plano Inativo'}
                </span>
              </div>
            </div>
            <Button
              onClick={logout}
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
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] pb-safe-area-inset-bottom">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;