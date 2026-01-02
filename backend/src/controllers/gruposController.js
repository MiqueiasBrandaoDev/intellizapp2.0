import { supabase } from '../config/database.js';

export const getGrupos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    // TODO: Implementar quando tabela grupos existir
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
    console.error('Erro ao buscar grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getGrupo = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implementar quando tabela grupos existir
    res.status(404).json({
      success: false,
      message: 'Grupo não encontrado'
    });

  } catch (error) {
    console.error('Erro ao buscar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const createGrupo = async (req, res) => {
  try {
    // TODO: Implementar quando tabela grupos existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const updateGrupo = async (req, res) => {
  try {
    // TODO: Implementar quando tabela grupos existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const deleteGrupo = async (req, res) => {
  try {
    // TODO: Implementar quando tabela grupos existir
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
