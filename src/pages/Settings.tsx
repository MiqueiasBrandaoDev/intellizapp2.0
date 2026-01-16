import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Shield,
  Clock,
  Bot,
  Volume2,
  Save,
  AlertTriangle,
  FileText,
  Settings as SettingsIcon,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    email: profile?.email || '',
    instancia: profile?.instancia || '',
    horaResumo: profile?.horaResumo || '09:00',
    resumoDiaAnterior: Boolean(profile?.resumoDiaAnterior),
    transcricao_ativa: Boolean(profile?.transcricao_ativa),
    'transcricao-pvd': Boolean(profile?.['transcricao-pvd']),
    transcreverEu: Boolean(profile?.transcreverEu),
    ludico: Boolean(profile?.ludico),
    agendamento: Boolean(profile?.agendamento),
    ambiente: profile?.ambiente || 'prod',
    'key-openai': profile?.['key-openai'] || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        email: profile.email || '',
        instancia: profile.instancia || '',
        horaResumo: profile.horaResumo || '09:00',
        resumoDiaAnterior: Boolean(profile.resumoDiaAnterior),
        transcricao_ativa: Boolean(profile.transcricao_ativa),
        'transcricao-pvd': Boolean(profile['transcricao-pvd']),
        transcreverEu: Boolean(profile.transcreverEu),
        ludico: Boolean(profile.ludico),
        agendamento: Boolean(profile.agendamento),
        ambiente: profile.ambiente || 'prod',
        'key-openai': profile['key-openai'] || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos de senha."
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A nova senha e confirmação não coincidem."
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres."
      });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    // Criar uma Promise que resolve quando o evento USER_UPDATED é disparado ou dá erro/timeout
    const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      let resolved = false;

      // Timeout de 10 segundos
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: 'Tempo limite excedido. Tente novamente.' });
        }
      }, 10000);

      // Listener para capturar o evento USER_UPDATED
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (resolved) return;

        if (event === 'USER_UPDATED') {
          resolved = true;
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve({ success: true });
        }
      });

      // Fazer a chamada - se der erro, resolve imediatamente
      supabase.auth.updateUser({ password: passwordData.newPassword })
        .then(({ error }) => {
          if (error && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            subscription.unsubscribe();

            let errorMessage = error.message;
            if (error.message.includes('different from the old password')) {
              errorMessage = 'A nova senha deve ser diferente da senha atual.';
            } else if (error.message.includes('at least')) {
              errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            }
            resolve({ success: false, error: errorMessage });
          }
        });
    });

    if (result.success) {
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Não foi possível alterar a senha.' });
    }

    setPasswordLoading(false);
  };

  const getNextResumeTime = () => {
    const now = new Date();
    const [hours, minutes] = formData.horaResumo.split(':');
    const resumeTime = new Date();
    resumeTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (now > resumeTime) {
      return `Amanhã às ${formData.horaResumo}`;
    }
    return `Hoje às ${formData.horaResumo}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold cyber-text flex items-center gap-2">
            <SettingsIcon className="h-7 w-7" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={profile?.plano_ativo
              ? "bg-green-500/10 text-green-400 border-green-500/30 px-3 py-1"
              : "bg-red-500/10 text-red-400 border-red-500/30 px-3 py-1"
            }
          >
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            Plano {profile?.plano_ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="perfil"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger
            value="resumos"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Resumos</span>
          </TabsTrigger>
          <TabsTrigger
            value="transcricoes"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-accent/10 data-[state=active]:text-accent"
          >
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">Transcrições</span>
          </TabsTrigger>
          <TabsTrigger
            value="seguranca"
            className="flex items-center gap-2 py-2.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Perfil */}
        <TabsContent value="perfil" className="mt-6 space-y-6">
          <Card className="cyber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Informações da Conta
              </CardTitle>
              <CardDescription>
                Dados básicos do seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                  <Input
                    disabled
                    id="nome"
                    value={formData.nome}
                    className="cyber-border bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Nome não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    className="cyber-border bg-muted/50"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conta criada em</span>
                  <span className="font-medium">
                    {profile?.criado_em ? new Date(profile.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Resumos */}
        <TabsContent value="resumos" className="mt-6 space-y-6">
          <Card className="cyber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-secondary" />
                Horário do Resumo Automático
              </CardTitle>
              <CardDescription>
                Configure quando os resumos serão enviados diariamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="space-y-2">
                  <Label htmlFor="horaResumo" className="text-sm font-medium">Horário</Label>
                  <Input
                    id="horaResumo"
                    type="time"
                    value={formData.horaResumo}
                    onChange={(e) => handleInputChange('horaResumo', e.target.value)}
                    className="cyber-border w-32 text-lg font-mono text-center"
                  />
                </div>

                <div className="flex-1 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                  <div className="flex items-center gap-2 text-secondary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Próximo envio</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">{getNextResumeTime()}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Resumos enviados automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-secondary" />
                Opções de Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-medium">Resumo do Dia Anterior</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir mensagens do dia anterior no resumo
                  </p>
                </div>
                <Switch
                  checked={formData.resumoDiaAnterior}
                  onCheckedChange={(checked) => handleInputChange('resumoDiaAnterior', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Transcrições */}
        <TabsContent value="transcricoes" className="mt-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-blue-400">Importante sobre transcrições</p>
                <p className="text-sm text-blue-300/80 mt-1">
                  Transcrições no privado consomem ResumeCoins. Certifique-se de ter saldo suficiente.
                </p>
              </div>
            </div>
          </div>

          <Card className="cyber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Volume2 className="h-5 w-5 text-accent" />
                Configurações de Transcrição
              </CardTitle>
              <CardDescription>
                Controle como os áudios são transcritos em conversas privadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-medium">Transcrição em Conversas Privadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Transcrever áudios recebidos em chats privados
                  </p>
                </div>
                <Switch
                  checked={formData['transcricao-pvd']}
                  onCheckedChange={(checked) => handleInputChange('transcricao-pvd', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-medium">Transcrever Meus Áudios</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir transcrição dos seus próprios áudios enviados
                  </p>
                </div>
                <Switch
                  checked={formData.transcreverEu}
                  onCheckedChange={(checked) => handleInputChange('transcreverEu', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="seguranca" className="mt-6 space-y-6">
          <Card className="cyber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-destructive" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensagem de feedback */}
              {passwordMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{passwordMessage.text}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="cyber-border"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="cyber-border"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {passwordLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed at bottom (hidden on security tab) */}
      {activeTab !== 'seguranca' && (
        <div className="sticky bottom-4 pt-4">
          <Card className="cyber-card border-primary/20 bg-background/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Lembre-se de salvar suas alterações
                </p>
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full sm:w-auto cyber-button"
                  size="lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
