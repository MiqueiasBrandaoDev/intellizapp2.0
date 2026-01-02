import { supabase } from '../config/database.js';

export const getMensagens = async (req, res) => {
  try {
    const { grupo_id, page = 1, limit = 100 } = req.query;

    if (!grupo_id) {
      return res.status(400).json({
        success: false,
        message: 'grupo_id é obrigatório'
      });
    }

    // TODO: Implementar quando tabela mensagens existir
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
    console.error('❌ Get mensagens error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const createMensagem = async (req, res) => {
  try {
    // TODO: Implementar quando tabela mensagens existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('❌ Create mensagem error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const deleteMensagem = async (req, res) => {
  try {
    // TODO: Implementar quando tabela mensagens existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('❌ Delete mensagem error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
