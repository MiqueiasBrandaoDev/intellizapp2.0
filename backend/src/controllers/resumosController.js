import { supabase } from '../config/database.js';

export const getResumos = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 20,
      usuario_id,
      data_inicio,
      data_fim,
      grupo_id,
      status,
      iaoculta
    } = req.query;

    // Usar usuario_id do query ou do token
    const targetUserId = usuario_id || userId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Query base com join na tabela grupos para obter nome e iaoculta
    let query = supabase
      .from('resumos')
      .select(`
        *,
        grupos!inner (
          nome_grupo,
          grupo_id_externo,
          iaoculta
        )
      `, { count: 'exact' })
      .eq('usuario_id', targetUserId)
      .order('data_criacao', { ascending: false });

    // Filtro por status
    if (status) {
      query = query.eq('status', status);
    }

    // Filtro por grupo específico
    if (grupo_id) {
      query = query.eq('grupo_id', grupo_id);
    }

    // Filtro por data de início
    if (data_inicio) {
      query = query.gte('data_criacao', data_inicio);
    }

    // Filtro por data de fim
    if (data_fim) {
      query = query.lte('data_criacao', data_fim);
    }

    // Filtro por iaoculta (através da tabela grupos)
    if (iaoculta !== undefined && iaoculta !== '') {
      const isOculta = iaoculta === 'true' || iaoculta === true;
      query = query.eq('grupos.iaoculta', isOculta);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar resumos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar resumos',
        error: error.message
      });
    }

    // Transformar dados para o formato esperado pelo frontend
    const resumosFormatados = (data || []).map(resumo => ({
      id: resumo.id,
      grupo_id: resumo.grupo_id,
      usuario_id: resumo.usuario_id,
      conteudo: resumo.conteudo,
      total_mensagens: resumo.total_mensagens || 0,
      status: resumo.status,
      data_criacao: resumo.data_criacao,
      data_envio: resumo.data_envio,
      erro_msg: resumo.erro_msg,
      // Campos do join com grupos
      grupo_nome: resumo.grupos?.nome_grupo || 'Grupo desconhecido',
      grupo_id_externo: resumo.grupos?.grupo_id_externo,
      iaoculta: resumo.grupos?.iaoculta || false
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: resumosFormatados,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
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
    const userId = req.user?.id;
    const { grupo_id, conteudo, total_mensagens, status = 'pendente' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não identificado'
      });
    }

    if (!grupo_id || !conteudo) {
      return res.status(400).json({
        success: false,
        message: 'grupo_id e conteudo são obrigatórios'
      });
    }

    // Verificar se o grupo pertence ao usuário
    const { data: grupo, error: grupoError } = await supabase
      .from('grupos')
      .select('id, nome_grupo')
      .eq('id', grupo_id)
      .eq('usuario_id', userId)
      .single();

    if (grupoError || !grupo) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado ou não pertence ao usuário'
      });
    }

    // Criar o resumo
    const { data: resumo, error } = await supabase
      .from('resumos')
      .insert({
        grupo_id,
        usuario_id: userId,
        conteudo,
        total_mensagens: total_mensagens || 0,
        status
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar resumo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar resumo',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: resumo,
      message: 'Resumo criado com sucesso'
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
    // Geração de resumos é feita por serviço externo/job
    // Este endpoint pode ser usado para disparar manualmente se necessário
    res.status(501).json({
      success: false,
      message: 'Geração de resumos é processada automaticamente pelo sistema'
    });

  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
