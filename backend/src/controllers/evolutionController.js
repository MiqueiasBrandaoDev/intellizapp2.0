// Evolution API configuration - Prioriza variáveis do backend (sem VITE_)
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || process.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || process.env.VITE_EVOLUTION_API_KEY || 'your-evolution-api-key';

// Simple in-memory cache for Evolution API groups
const groupsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const connectInstance = async (req, res) => {
  try {
    const { instanceName, userId } = req.body;

    if (!instanceName || !userId) {
      return res.status(400).json({
        success: false,
        message: 'instanceName e userId são obrigatórios'
      });
    }

    // First check if instance already exists
    const statusController = new AbortController();
    const statusTimeout = setTimeout(() => statusController.abort(), 15000); // 15 seconds timeout
    
    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      signal: statusController.signal
    });
    
    clearTimeout(statusTimeout);

    let existingInstance = null;
    if (statusResponse.ok) {
      const instances = await statusResponse.json();
      existingInstance = instances.find(instance => 
        instance.name === instanceName
      );
    }

    // Check if instance is already connected
    if (existingInstance && existingInstance.connectionStatus === 'open') {
      return res.json({
        success: true,
        message: 'WhatsApp já conectado',
        connected: true,
        instance: existingInstance
      });
    }

    // Create instance if it doesn't exist
    if (!existingInstance) {
      const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          instanceName: instanceName,
          token: EVOLUTION_API_KEY,
          qrcode: true,
          webhook: `${process.env.VITE_API_URL}/api/webhooks/evolution`,
          webhookByEvents: false,
          webhookBase64: false,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE']
        })
      });

      if (!createResponse.ok) {
        throw new Error('Falha ao criar instância');
      }

      await createResponse.json();
    }

    // Connect to WhatsApp
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!connectResponse.ok) {
      throw new Error('Falha ao conectar com WhatsApp');
    }

    const connectData = await connectResponse.json();

    // Check if already connected
    if (connectData.connectionStatus === 'open') {
      return res.json({
        success: true,
        message: 'WhatsApp já conectado',
        connected: true,
        instance: connectData
      });
    }

    // If QR code is available
    if (connectData.base64 || connectData.qrcode) {
      return res.json({
        success: true,
        message: 'QR Code gerado com sucesso',
        qrCode: connectData.base64 || connectData.qrcode,
        instance: connectData.instance
      });
    }

    res.json({
      success: true,
      message: 'Conexão iniciada',
      data: connectData
    });

  } catch (error) {
    let errorMessage = 'Erro interno do servidor';
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout ao conectar com WhatsApp. Tente novamente.';
    } else if (error.message) {
      errorMessage = error.message.replace(/Evolution API/gi, 'WhatsApp');
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getInstanceStatus = async (req, res) => {
  try {
    const { instanceName } = req.params;

    // Busca apenas a instância específica usando connectionState (não fetchInstances)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Se a instância não existe, retorna not_found
      if (response.status === 404) {
        return res.json({
          success: true,
          connected: false,
          state: 'not_found',
          instance: null
        });
      }
      throw new Error('Falha ao verificar status da instância');
    }

    const data = await response.json();
    const state = data.instance?.state || data.state || 'disconnected';
    const connected = state === 'open';

    return res.json({
      success: true,
      connected,
      state,
      instance: data.instance || data
    });

  } catch (error) {
    let errorMessage = 'Erro interno do servidor';
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout ao verificar status do WhatsApp. Tente novamente.';
    } else if (error.message) {
      errorMessage = error.message.replace(/Evolution API/gi, 'WhatsApp');
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const disconnectInstance = async (req, res) => {
  try {
    const { instanceName } = req.params;

    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao desconectar instância');
    }

    const data = await response.json();

    res.json({
      success: true,
      message: 'Instância desconectada com sucesso',
      data
    });

  } catch (error) {
    let errorMessage = 'Erro interno do servidor';
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout ao desconectar WhatsApp. Tente novamente.';
    } else if (error.message) {
      errorMessage = error.message.replace(/Evolution API/gi, 'WhatsApp');
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Helper function to retry fetch with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const getInstanceGroups = async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId é obrigatório'
      });
    }

    // Check cache first
    const cacheKey = `${instanceName}_${userId}`;
    const cachedData = groupsCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        message: `${cachedData.data.length} grupos encontrados (cache)`,
        data: cachedData.data,
        cached: true
      });
    }

    // Verificar status da instância antes de buscar grupos
    try {
      const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        if (statusData.instance?.state !== 'open') {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp desconectado. Por favor, escaneie o QR Code novamente para reconectar.',
            disconnected: true,
            state: statusData.instance?.state || 'unknown'
          });
        }
      }
    } catch (statusError) {
      // Não foi possível verificar status, tenta buscar grupos mesmo assim
    }

    // Create AbortController for timeout - increased to 3 minutes for groups fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetchWithRetry(`${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Falha ao buscar grupos: ${response.status} ${response.statusText}`);
      }

      const groups = await response.json();

      // Check if groups is an array
      if (!Array.isArray(groups)) {
        throw new Error('Formato de resposta inválido do WhatsApp');
      }

      // Format groups for our database (userId é UUID do Supabase)
      const formattedGroups = groups.map(group => ({
        nome_grupo: group.subject || 'Sem nome',
        grupo_id_externo: group.id,
        usuario_id: userId,
        ativo: true,
        participantes: group.participants?.length || 0,
        descricao: group.desc || null
      }));

      // Cache the result
      groupsCache.set(cacheKey, {
        data: formattedGroups,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        message: `${groups.length} grupos encontrados`,
        data: formattedGroups
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout ao buscar grupos. WhatsApp está demorando para responder.');
      }
      
      throw fetchError;
    }

  } catch (error) {
    let errorMessage = 'Não foi possível buscar os grupos. Tente novamente.';

    if (error.message.includes('Timeout') || error.message.includes('demorando')) {
      errorMessage = 'WhatsApp está demorando para responder. Tente novamente.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Não foi possível conectar com a Evolution API.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Timeout ao buscar grupos. Tente novamente.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};