import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  throw new Error('Missing Supabase environment variables');
}

// Cliente com service_role para operações do backend (bypass RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função de inicialização (para compatibilidade)
export const createConnection = async () => {
  try {
    // Testar conexão
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = tabela não encontrada (ok se ainda não existe)
      if (error.code !== '42P01') { // 42P01 = relation does not exist
        console.warn('⚠️ Supabase connection warning:', error.message);
      }
    }

    console.log('✅ Connected to Supabase:', supabaseUrl);
    return supabase;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
};

// Alias para compatibilidade
export const getConnection = () => supabase;

// Helper para queries diretas (compatibilidade com código legado)
export const query = async (table, operation, params = {}) => {
  try {
    let result;

    switch (operation) {
      case 'select':
        result = await supabase.from(table).select(params.columns || '*');
        break;
      case 'insert':
        result = await supabase.from(table).insert(params.data).select();
        break;
      case 'update':
        result = await supabase.from(table).update(params.data).match(params.match).select();
        break;
      case 'delete':
        result = await supabase.from(table).delete().match(params.match);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    console.error('❌ Supabase query error:', error.message);
    throw error;
  }
};

export default supabase;
