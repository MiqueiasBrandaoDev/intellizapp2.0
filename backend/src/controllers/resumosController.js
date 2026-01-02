import { supabase } from '../config/database.js';

export const getResumos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    // TODO: Implementar quando tabela resumos existir
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar resumos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const createResumo = async (req, res) => {
  try {
    // TODO: Implementar quando tabela resumos existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('Erro ao criar resumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const gerarResumo = async (req, res) => {
  try {
    // TODO: Implementar quando tabela resumos existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
