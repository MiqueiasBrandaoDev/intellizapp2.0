// Auth é gerenciado pelo Supabase Auth no frontend
// Esses endpoints são mantidos apenas para compatibilidade

export const login = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Use Supabase Auth no frontend para login'
  });
};

export const register = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Use Supabase Auth no frontend para registro'
  });
};

export const forgotPassword = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Use Supabase Auth no frontend para recuperação de senha'
  });
};
