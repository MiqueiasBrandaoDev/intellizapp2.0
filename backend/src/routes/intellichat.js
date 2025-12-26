import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = express.Router();

// POST /api/intellichat - Proxy para o webhook da IA
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Input é obrigatório'
      });
    }

    console.log('📤 Enviando mensagem para IA:', input);
    console.log('👤 ID do usuário:', req.user.id);

    const webhookUrl = 'https://primary-production-70c40.up.railway.app/webhook/7e457a0e-515e-4b10-a7a5-0d57d8ff5fc4';
    console.log('🌐 URL do webhook:', webhookUrl);

    // Fazer chamada ao webhook Railway
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        userId: req.user.id
      }),
    });

    console.log('📡 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do webhook:', errorText);
      throw new Error(`Webhook retornou status ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { response: text };
    }

    console.log('📥 Resposta da IA recebida:', data);

    res.json({
      success: true,
      response: data.response || data.output || data.message || data.text || 'Resposta recebida',
      data
    });

  } catch (error) {
    console.error('❌ Erro ao processar mensagem IA:', error);

    // Fallback response para testes (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Usando resposta de fallback para desenvolvimento');
      return res.json({
        success: true,
        response: `Recebi sua mensagem: "${req.body.input}". O webhook está temporariamente indisponível. Verifique a URL e configurações do webhook.`,
        fallback: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao processar mensagem com IA',
      error: error.message
    });
  }
});

export default router;
