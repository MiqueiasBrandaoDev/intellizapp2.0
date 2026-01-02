import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, ExternalLink, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresActivePlan?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresActivePlan = false
}) => {
  const { profile, isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Se o usuário está autenticado mas não tem perfil (tabela usuarios pode não existir)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="cyber-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="bg-yellow-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Perfil não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Seu perfil ainda não foi configurado no sistema.
              Por favor, contate o administrador ou execute o setup do banco de dados.
            </p>
            <p className="text-xs text-muted-foreground">
              Auth ID: {profile === null ? 'Verificando...' : 'N/A'}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se a rota requer plano ativo e o usuário não tem
  if (requiresActivePlan && !profile?.plano_ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="cyber-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Plano Premium Necessário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Esta funcionalidade requer um plano premium ativo.
            </p>
            
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-medium">Plano Premium - R$ 197</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Acesso completo a todos os recursos
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full cyber-button"
                onClick={() => window.location.href = '/meu-plano'}
              >
                <Crown className="mr-2 h-4 w-4" />
                Ver Planos
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://payment.ticto.app/O58A018E0', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ativar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;