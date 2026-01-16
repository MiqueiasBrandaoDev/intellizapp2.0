import { supabase } from '../config/database.js';

// Helper para buscar o ID do usuário na tabela usuarios usando auth_id
const getUsuarioId = async (authId) => {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (error || !usuario) {
    console.error('Erro ao buscar usuario por auth_id:', error);
    return null;
  }

  return usuario.id;
};

export const getDashboardStats = async (req, res) => {
  try {
    const authId = req.user?.id; // Este é o auth_id do Supabase Auth

    if (!authId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // Buscar o ID real do usuário na tabela usuarios
    const userId = await getUsuarioId(authId);

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil do usuário não encontrado'
      });
    }

    // Buscar total de grupos e grupos ativos
    const { data: grupos, error: gruposError } = await supabase
      .from('grupos')
      .select('id, ativo')
      .eq('usuario_id', userId);

    if (gruposError) {
      console.error('Erro ao buscar grupos:', gruposError);
      throw gruposError;
    }

    const totalGroups = grupos?.length || 0;
    const activeGroups = grupos?.filter(g => g.ativo)?.length || 0;

    // Buscar total de resumos e resumos de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = hoje.toISOString();

    const { data: resumos, error: resumosError } = await supabase
      .from('resumos')
      .select('id, data_criacao')
      .eq('usuario_id', userId);

    if (resumosError) {
      console.error('Erro ao buscar resumos:', resumosError);
      throw resumosError;
    }

    const totalResumes = resumos?.length || 0;
    const resumosHoje = resumos?.filter(r => {
      const dataResumo = new Date(r.data_criacao);
      return dataResumo >= hoje;
    })?.length || 0;

    // Buscar total de mensagens processadas e mensagens de hoje
    const { data: mensagens, error: mensagensError } = await supabase
      .from('mensagens')
      .select('id, data_mensagem')
      .eq('usuario_id', userId);

    if (mensagensError) {
      console.error('Erro ao buscar mensagens:', mensagensError);
      throw mensagensError;
    }

    const messagesProcessed = mensagens?.length || 0;
    const mensagensHoje = mensagens?.filter(m => {
      if (!m.data_mensagem) return false;
      const dataMensagem = new Date(m.data_mensagem);
      return dataMensagem >= hoje;
    })?.length || 0;

    const stats = {
      totalGroups,
      activeGroups,
      totalResumes,
      messagesProcessed,
      resumosHoje,
      mensagensHoje
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const authId = req.user?.id; // Este é o auth_id do Supabase Auth
    const limit = parseInt(req.query.limit) || 5;

    if (!authId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // Buscar o ID real do usuário na tabela usuarios
    const userId = await getUsuarioId(authId);

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil do usuário não encontrado'
      });
    }

    // Buscar últimos resumos com nome do grupo
    const { data: resumos, error: resumosError } = await supabase
      .from('resumos')
      .select(`
        id,
        status,
        data_envio,
        data_criacao,
        total_mensagens,
        grupo_id,
        grupos (
          nome_grupo
        )
      `)
      .eq('usuario_id', userId)
      .order('data_criacao', { ascending: false })
      .limit(limit);

    if (resumosError) {
      console.error('Erro ao buscar atividade recente:', resumosError);
      throw resumosError;
    }

    // Formatar resposta
    const activity = resumos?.map(r => ({
      id: r.id,
      grupo_nome: r.grupos?.nome_grupo || 'Grupo desconhecido',
      data_envio: r.data_envio || r.data_criacao,
      status: r.status,
      total_mensagens: r.total_mensagens
    })) || [];

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Erro ao buscar atividade recente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getSystemInsights = async (req, res) => {
  try {
    const authId = req.user?.id; // Este é o auth_id do Supabase Auth

    if (!authId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // Buscar o ID real do usuário na tabela usuarios
    const userId = await getUsuarioId(authId);

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'Perfil do usuário não encontrado'
      });
    }

    // Calcular data de 7 dias atrás
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const seteDiasAtrasISO = seteDiasAtras.toISOString();

    // Buscar grupo mais ativo (com mais mensagens nos últimos 7 dias)
    const { data: gruposComMensagens, error: gruposError } = await supabase
      .from('grupos')
      .select(`
        id,
        nome_grupo,
        mensagens (
          id,
          data_mensagem
        )
      `)
      .eq('usuario_id', userId)
      .eq('ativo', true);

    if (gruposError) {
      console.error('Erro ao buscar grupos com mensagens:', gruposError);
      throw gruposError;
    }

    // Calcular mensagens por grupo nos últimos 7 dias
    let mostActiveGroup = null;
    let mostActiveGroupMessages = 0;
    let totalMensagens7Dias = 0;

    gruposComMensagens?.forEach(grupo => {
      const mensagens7dias = grupo.mensagens?.filter(m => {
        if (!m.data_mensagem) return false;
        return new Date(m.data_mensagem) >= seteDiasAtras;
      })?.length || 0;

      totalMensagens7Dias += mensagens7dias;

      if (mensagens7dias > mostActiveGroupMessages) {
        mostActiveGroupMessages = mensagens7dias;
        mostActiveGroup = grupo.nome_grupo;
      }
    });

    // Calcular média diária
    const avgMessagesPerDay = Math.round(totalMensagens7Dias / 7);

    // Buscar último resumo enviado
    const { data: ultimoResumo, error: resumoError } = await supabase
      .from('resumos')
      .select(`
        data_envio,
        grupos (
          nome_grupo
        )
      `)
      .eq('usuario_id', userId)
      .eq('status', 'enviado')
      .order('data_envio', { ascending: false })
      .limit(1)
      .single();

    // Não tratar como erro se não encontrar resumo
    const lastResumeTime = ultimoResumo?.data_envio || null;
    const lastResumeGroup = ultimoResumo?.grupos?.nome_grupo || null;

    const insights = {
      mostActiveGroup: mostActiveGroup || 'Nenhum grupo ativo',
      mostActiveGroupMessages,
      avgMessagesPerDay,
      lastResumeTime,
      lastResumeGroup
    };

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Erro ao buscar insights do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
