import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bot, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos."
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/dashboard');
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Intellizapp.IA"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Email ou senha inválidos."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login com Google",
        description: error.message || "Não foi possível fazer login com Google."
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md cyber-card relative z-10 shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo with animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30">
                <Bot className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold cyber-text">
              Intellizapp.IA
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Automatize seus grupos de WhatsApp com IA
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border-gray-300 font-medium transition-all duration-200 hover:shadow-md"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-3">Continuar com Google</span>
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                ou entre com email
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 cyber-border bg-background/50 focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 cyber-border bg-background/50 focus:bg-background transition-colors"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors hover:underline"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 cyber-button font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                to="/auth/register"
                className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground/60">
        <p>&copy; {new Date().getFullYear()} Intellizapp.IA - Todos os direitos reservados</p>
      </div>
    </div>
  );
};

export default Login;
