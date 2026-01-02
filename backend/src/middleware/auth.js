import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  try {
    // Validar token do Supabase
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);

    // Token do Supabase: sub = user id (UUID), email, role
    if (decoded.sub) {
      req.user = {
        id: decoded.sub, // UUID do Supabase Auth
        email: decoded.email,
        role: decoded.role
      };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Token inválido - estrutura não reconhecida'
    });
  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Função legada - não mais necessária com Supabase Auth
// Mantida para compatibilidade com código antigo
export const generateToken = (userId) => {
  console.warn('⚠️ generateToken é legado - use Supabase Auth');
  return jwt.sign(
    { sub: userId },
    SUPABASE_JWT_SECRET,
    { expiresIn: '7d' }
  );
};
