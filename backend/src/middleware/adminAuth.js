import { supabase } from '../config/database.js';

export const authenticateAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // TODO: Implementar verificação de admin quando tabela usuarios tiver campo is_admin
    // Por enquanto, bloqueia acesso admin
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Sistema admin em construção.'
    });

  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
