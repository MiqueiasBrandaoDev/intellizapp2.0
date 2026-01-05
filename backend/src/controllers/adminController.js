import { supabase } from '../config/database.js';

// Get dashboard stats for admin
export const getAdminStats = async (req, res) => {
  try {
    // TODO: Implementar quando tabelas existirem
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      totalGroups: 0,
      totalResumos: 0,
      resumosToday: 0,
      planStats: []
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get all users for admin management
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // TODO: Implementar quando tabela usuarios estiver completa
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
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Update user plan status
export const updateUserPlan = async (req, res) => {
  try {
    // TODO: Implementar quando tabela usuarios estiver completa
    res.status(501).json({
      success: false,
      message: 'Funcionalidade não implementada - tabelas em construção'
    });

  } catch (error) {
    console.error('❌ Update user plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get system activity logs
export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // TODO: Implementar quando tabelas existirem
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
    console.error('❌ Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
