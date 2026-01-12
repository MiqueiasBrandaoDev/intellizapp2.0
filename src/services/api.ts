import {
  Usuario,
  Grupo,
  Mensagem,
  Resumo,
  ResumoWithGrupo,
  CreateUsuarioData,
  CreateGrupoData,
  CreateMensagemData,
  CreateResumoData,
  UpdateUsuarioData,
  DashboardStats,
  RecentActivity,
  ApiResponse,
  PaginatedResponse,
  GrupoWithMensagens,
  IntelliChatSession,
  IntelliChatMensagem
} from '@/types/database';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001');

class ApiService {
  private async getToken(): Promise<string | null> {
    try {
      // First try to get the current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error);
        return null;
      }

      // If no session, return null
      if (!session) {
        console.warn('⚠️ No session found');
        return null;
      }

      // Check if token is expired or about to expire (less than 5 minutes left)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          console.log('🔄 Token expiring soon, refreshing...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('❌ Error refreshing session:', refreshError);
            // If refresh fails, try to use the old token anyway
            return session.access_token;
          }

          if (refreshedSession) {
            console.log('✅ Session refreshed successfully');
            return refreshedSession.access_token;
          }
        }
      }

      return session.access_token;
    } catch (error) {
      console.error('❌ Exception in getToken:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await this.getToken();

    if (!token && !endpoint.includes('/auth/')) {
      console.error('❌ No token available for request:', endpoint);
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Set default timeout - longer for Evolution and IntelliChat API calls
    const controller = new AbortController();
    const isEvolutionCall = endpoint.includes('/evolution/');
    const isIntelliChatCall = endpoint.includes('/intellichat');
    const timeoutMs = (isEvolutionCall || isIntelliChatCall) ? 180000 : 30000; // 3 minutes for Evolution/IntelliChat, 30s for others
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout after ${timeoutMs}ms for ${endpoint}`);
      controller.abort();
    }, timeoutMs);

    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      console.log(`📤 Making request to: ${endpoint}`);
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Request failed [${endpoint}]:`, error);
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, senha: string): Promise<ApiResponse<{ user: Usuario; token: string }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  }

  async register(userData: CreateUsuarioData): Promise<ApiResponse<{ user: Usuario; token: string }>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Usuario endpoints
  async getUser(id: number): Promise<ApiResponse<Usuario>> {
    return this.request(`/api/usuarios/${id}`);
  }

  async updateUser(id: number, data: UpdateUsuarioData): Promise<ApiResponse<Usuario>> {
    return this.request(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request(`/api/usuarios/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // Grupos endpoints
  async getGrupos(usuarioId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Grupo>> {
    return this.request(`/api/grupos?usuario_id=${usuarioId}&page=${page}&limit=${limit}`);
  }

  async getGrupo(id: string): Promise<ApiResponse<GrupoWithMensagens>> {
    return this.request(`/api/grupos/${id}`);
  }

  async createGrupo(data: CreateGrupoData): Promise<ApiResponse<Grupo>> {
    return this.request('/api/grupos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGrupo(id: string, data: Partial<CreateGrupoData>): Promise<ApiResponse<Grupo>> {
    return this.request(`/api/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGrupo(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/grupos/${id}`, {
      method: 'DELETE',
    });
  }

  // Mensagens endpoints
  async getMensagens(
    grupoId: number,
    page: number = 1,
    limit: number = 100
  ): Promise<PaginatedResponse<Mensagem>> {
    return this.request(`/api/mensagens?grupo_id=${grupoId}&page=${page}&limit=${limit}`);
  }

  async createMensagem(data: CreateMensagemData): Promise<ApiResponse<Mensagem>> {
    return this.request('/api/mensagens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMensagem(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/mensagens/${id}`, {
      method: 'DELETE',
    });
  }

  // Resumos endpoints
  async getResumos(
    usuarioId: number,
    page: number = 1,
    limit: number = 20,
    dataInicio?: string,
    dataFim?: string,
    grupoId?: number,
    status?: string
  ): Promise<PaginatedResponse<ResumoWithGrupo>> {
    let endpoint = `/api/resumos?usuario_id=${usuarioId}&page=${page}&limit=${limit}`;

    if (dataInicio) endpoint += `&data_inicio=${dataInicio}`;
    if (dataFim) endpoint += `&data_fim=${dataFim}`;
    if (grupoId) endpoint += `&grupo_id=${grupoId}`;
    if (status) endpoint += `&status=${status}`;

    return this.request(endpoint);
  }

  async createResumo(data: CreateResumoData): Promise<ApiResponse<Resumo>> {
    return this.request('/api/resumos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async gerarResumo(grupoId: number): Promise<ApiResponse<Resumo>> {
    return this.request('/api/resumos/gerar', {
      method: 'POST',
      body: JSON.stringify({ grupo_id: grupoId }),
    });
  }

  // Dashboard endpoints
  async getDashboardStats(usuarioId: number): Promise<ApiResponse<DashboardStats>> {
    return this.request(`/api/dashboard/stats?usuario_id=${usuarioId}`);
  }

  async getRecentActivity(usuarioId: number, limit: number = 5): Promise<ApiResponse<RecentActivity[]>> {
    return this.request(`/api/dashboard/activity?usuario_id=${usuarioId}&limit=${limit}`);
  }

  async getSystemInsights(usuarioId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/dashboard/insights?usuario_id=${usuarioId}`);
  }

  // Evolution API endpoints
  async getEvolutionGroups(instanceName: string, userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/evolution/groups/${instanceName}?userId=${userId}`);
  }

  async getEvolutionStatus(instanceName: string): Promise<ApiResponse<any>> {
    return this.request(`/api/evolution/status/${instanceName}`);
  }

  async connectEvolution(instanceName: string, userId: string): Promise<ApiResponse<any>> {
    return this.request('/api/evolution/connect', {
      method: 'POST',
      body: JSON.stringify({ instanceName, userId }),
    });
  }

  async disconnectEvolution(instanceName: string): Promise<ApiResponse<any>> {
    return this.request(`/api/evolution/disconnect/${instanceName}`, {
      method: 'DELETE',
    });
  }

  // IntelliChat endpoints
  async sendIntelliChatMessage(input: string): Promise<ApiResponse<{ response?: string; output?: string; message?: string; data?: any; fallback?: boolean }>> {
    return this.request('/api/intellichat', {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  // IntelliChat Sessions endpoints
  async getUserSessions(usuarioId: string): Promise<ApiResponse<IntelliChatSession[]>> {
    return this.request(`/api/intellichat-sessions/sessions?usuario_id=${usuarioId}`);
  }

  async getOrCreateActiveSession(usuarioId: string): Promise<ApiResponse<IntelliChatSession>> {
    return this.request(`/api/intellichat-sessions/sessions/active?usuario_id=${usuarioId}`);
  }

  async createNewSession(usuarioId: string): Promise<ApiResponse<IntelliChatSession>> {
    return this.request('/api/intellichat-sessions/sessions/new', {
      method: 'POST',
      body: JSON.stringify({ usuario_id: usuarioId }),
    });
  }

  async getSessionMessages(sessionId: string): Promise<ApiResponse<IntelliChatMensagem[]>> {
    return this.request(`/api/intellichat-sessions/sessions/${sessionId}/messages`);
  }

  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<ApiResponse<IntelliChatMensagem>> {
    return this.request('/api/intellichat-sessions/messages', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, role, content }),
    });
  }

  async updateSessionTitle(sessionId: string, titulo: string): Promise<ApiResponse<IntelliChatSession>> {
    return this.request(`/api/intellichat-sessions/sessions/${sessionId}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ titulo }),
    });
  }

  async activateSession(sessionId: string): Promise<ApiResponse<IntelliChatSession>> {
    return this.request(`/api/intellichat-sessions/sessions/${sessionId}/activate`, {
      method: 'PATCH',
    });
  }

  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('data', audioBlob, 'audio.webm');

    const url = import.meta.env.VITE_TRANSCRIPTION_WEBHOOK_URL;

    if (!url) {
      throw new Error('VITE_TRANSCRIPTION_WEBHOOK_URL não configurada no .env');
    }

    try {
      console.log('📤 Enviando áudio para transcrição...');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Resposta da transcrição:', data);

      // O webhook retorna { text: "texto transcrito", usage: {...}, type: "duration", seconds: 5 }
      const transcribedText = data.text || '';

      return {
        success: true,
        data: { text: transcribedText }
      };
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    }
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;