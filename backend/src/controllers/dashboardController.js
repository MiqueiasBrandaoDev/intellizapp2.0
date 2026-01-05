import { supabase } from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // TODO: Implementar quando as tabelas estiverem criadas
    // Por enquanto, retorna stats zeradas
    const stats = {
      totalGroups: 0,
      activeGroups: 0,
      totalResumes: 0,
      messagesProcessed: 0,
      resumosHoje: 0,
      mensagensHoje: 0
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // TODO: Implementar quando as tabelas estiverem criadas
    res.json({
      success: true,
      data: []
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // TODO: Implementar quando as tabelas estiverem criadas
    const insights = {
      mostActiveGroup: 'Nenhum grupo ativo',
      mostActiveGroupMessages: 0,
      avgMessagesPerDay: 0,
      lastResumeTime: null,
      lastResumeGroup: null,
      productivityScore: 0,
      activeGroups: 0,
      resumesGenerated: 0
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
