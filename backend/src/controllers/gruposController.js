import { supabase } from '../config/database.js';

export const getGrupos = async (req, res) => {
  try {
    const { usuario_id, page = 1, limit = 50 } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id é obrigatório'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Buscar grupos do usuário
    const { data: grupos, error, count } = await supabase
      .from('grupos')
      .select('*', { count: 'exact' })
      .eq('usuario_id', usuario_id)
      .order('criado_em', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar grupos',
        error: error.message
      });
    }

    const totalPages = Math.ceil((count || 0) / parseInt(limit));

    res.json({
      success: true,
      data: grupos || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getGrupo = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: grupo, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Grupo não encontrado'
        });
      }
      console.error('Erro ao buscar grupo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar grupo',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: grupo
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
    const { nome_grupo, grupo_id_externo, usuario_id, ativo = true, transcricao_ativa = false, resumo_ativo = true, ludico = false, iaoculta = false } = req.body;

    console.log('📥 Criando grupo:', { nome_grupo, grupo_id_externo, usuario_id, iaoculta });

    // Validações
    if (!nome_grupo) {
      return res.status(400).json({
        success: false,
        message: 'nome_grupo é obrigatório'
      });
    }

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id é obrigatório'
      });
    }

    // Verificar se o grupo já existe para este usuário
    if (grupo_id_externo) {
      const { data: existingGroup } = await supabase
        .from('grupos')
        .select('id')
        .eq('grupo_id_externo', grupo_id_externo)
        .eq('usuario_id', usuario_id)
        .single();

      if (existingGroup) {
        return res.status(409).json({
          success: false,
          message: 'Este grupo já está cadastrado'
        });
      }
    }

    // Verificar limite de grupos do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('max_grupos')
      .eq('id', usuario_id)
      .single();

    if (usuario) {
      const { count: gruposCount } = await supabase
        .from('grupos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario_id);

      if (gruposCount >= usuario.max_grupos) {
        return res.status(403).json({
          success: false,
          message: `Limite de ${usuario.max_grupos} grupos atingido. Faça upgrade do seu plano.`
        });
      }
    }

    // Inserir grupo
    const { data: newGrupo, error } = await supabase
      .from('grupos')
      .insert([{
        nome_grupo,
        grupo_id_externo,
        usuario_id,
        ativo,
        transcricao_ativa,
        resumo_ativo,
        ludico,
        iaoculta
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar grupo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar grupo',
        error: error.message
      });
    }

    console.log('✅ Grupo criado com iaoculta:', newGrupo.iaoculta, '| Grupo completo:', newGrupo);

    res.status(201).json({
      success: true,
      message: 'Grupo criado com sucesso',
      data: newGrupo
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
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Atualizando grupo:', id, updateData);

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.criado_em;
    delete updateData.usuario_id;

    // Adicionar updated_at
    updateData.updated_at = new Date().toISOString();

    const { data: updatedGrupo, error } = await supabase
      .from('grupos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Grupo não encontrado'
        });
      }
      console.error('Erro ao atualizar grupo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar grupo',
        error: error.message
      });
    }

    console.log('✅ Grupo atualizado:', updatedGrupo);

    res.json({
      success: true,
      message: 'Grupo atualizado com sucesso',
      data: updatedGrupo
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
    const { id } = req.params;

    console.log('🗑️ Deletando grupo:', id);

    // Verificar se o grupo existe
    const { data: grupo, error: findError } = await supabase
      .from('grupos')
      .select('id, nome_grupo')
      .eq('id', id)
      .single();

    if (findError || !grupo) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }

    // Deletar grupo
    const { error: deleteError } = await supabase
      .from('grupos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar grupo:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar grupo',
        error: deleteError.message
      });
    }

    console.log('✅ Grupo deletado:', grupo.nome_grupo);

    res.json({
      success: true,
      message: 'Grupo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar grupo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
