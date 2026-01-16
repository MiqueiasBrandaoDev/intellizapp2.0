import { supabase } from '../config/database.js';

// Get all sessions for a user
export const getUserSessions = async (req, res) => {
  try {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id é obrigatório'
      });
    }

    const { data: sessions, error } = await supabase
      .from('intellichat_sessions')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar sessões:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar sessões',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: sessions || []
    });

  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get active session or create one
export const getOrCreateActiveSession = async (req, res) => {
  try {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id é obrigatório'
      });
    }

    // Try to get active session
    let { data: activeSession, error: findError } = await supabase
      .from('intellichat_sessions')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('ativa', true)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    // If no active session, create one
    if (!activeSession || findError) {
      const { data: newSession, error: createError } = await supabase
        .from('intellichat_sessions')
        .insert([{
          usuario_id,
          ativa: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar sessão:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar sessão',
          error: createError.message
        });
      }

      activeSession = newSession;
    }

    res.json({
      success: true,
      data: activeSession
    });

  } catch (error) {
    console.error('Erro ao buscar/criar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Create new session (and deactivate previous ones)
export const createNewSession = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'usuario_id é obrigatório'
      });
    }

    // Deactivate all previous sessions
    await supabase
      .from('intellichat_sessions')
      .update({ ativa: false })
      .eq('usuario_id', usuario_id);

    // Create new active session
    const { data: newSession, error } = await supabase
      .from('intellichat_sessions')
      .insert([{
        usuario_id,
        ativa: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nova sessão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar nova sessão',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Nova sessão criada com sucesso',
      data: newSession
    });

  } catch (error) {
    console.error('Erro ao criar nova sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Get messages from a session
export const getSessionMessages = async (req, res) => {
  try {
    const { session_id } = req.params;

    const { data: messages, error } = await supabase
      .from('intellichat_mensagens')
      .select('*')
      .eq('session_id', session_id)
      .order('criado_em', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar mensagens',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: messages || []
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Save a message
export const saveMessage = async (req, res) => {
  try {
    const { session_id, role, content } = req.body;

    if (!session_id || !role || !content) {
      return res.status(400).json({
        success: false,
        message: 'session_id, role e content são obrigatórios'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role deve ser "user" ou "assistant"'
      });
    }

    // Save the message
    const { data: message, error } = await supabase
      .from('intellichat_mensagens')
      .insert([{
        session_id,
        role,
        content
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar mensagem:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar mensagem',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Mensagem salva com sucesso',
      data: message
    });

  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Update session title
export const updateSessionTitle = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { titulo } = req.body;

    if (!titulo) {
      return res.status(400).json({
        success: false,
        message: 'titulo é obrigatório'
      });
    }

    const { data: session, error } = await supabase
      .from('intellichat_sessions')
      .update({ titulo })
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar título da sessão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar título da sessão',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Título atualizado com sucesso',
      data: session
    });

  } catch (error) {
    console.error('Erro ao atualizar título da sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Activate a specific session
export const activateSession = async (req, res) => {
  try {
    const { session_id } = req.params;

    // First get the session to get usuario_id
    const { data: session, error: getError } = await supabase
      .from('intellichat_sessions')
      .select('usuario_id')
      .eq('id', session_id)
      .single();

    if (getError || !session) {
      console.error('Erro ao buscar sessão:', getError);
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada',
        error: getError?.message
      });
    }

    // Deactivate all sessions for this user
    await supabase
      .from('intellichat_sessions')
      .update({ ativa: false })
      .eq('usuario_id', session.usuario_id);

    // Activate the selected session
    const { data: activatedSession, error: activateError } = await supabase
      .from('intellichat_sessions')
      .update({ ativa: true })
      .eq('id', session_id)
      .select()
      .single();

    if (activateError) {
      console.error('Erro ao ativar sessão:', activateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao ativar sessão',
        error: activateError.message
      });
    }

    res.json({
      success: true,
      message: 'Sessão ativada com sucesso',
      data: activatedSession
    });

  } catch (error) {
    console.error('Erro ao ativar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
