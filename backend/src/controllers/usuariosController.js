import { supabase } from '../config/database.js';

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.auth_id;
    delete updateData.email;
    delete updateData.criado_em;

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('auth_id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const changePassword = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Use Supabase Auth no frontend para alterar senha'
  });
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('auth_id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
