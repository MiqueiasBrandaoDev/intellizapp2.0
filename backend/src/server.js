import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import gruposRoutes from './routes/grupos.js';
import mensagensRoutes from './routes/mensagens.js';
import evolutionRoutes from './routes/evolution.js';
import dashboardRoutes from './routes/dashboard.js';
import resumosRoutes from './routes/resumos.js';
import healthRoutes from './routes/health.js';
import adminRoutes from './routes/admin.js';
import intellichatRoutes from './routes/intellichat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Set server timeout to 3 minutes for long-running Evolution API calls
app.use((req, res, next) => {
  // Set timeout to 3 minutes for Evolution API routes
  if (req.path.includes('/evolution/') || req.path.includes('/api/evolution/')) {
    console.log(`🕐 Setting 3-minute timeout for Evolution route: ${req.path}`);
    req.setTimeout(180000); // 3 minutes
    res.setTimeout(180000); // 3 minutes
  } else {
    req.setTimeout(30000); // 30 seconds for other routes
    res.setTimeout(30000); // 30 seconds for other routes
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'InteliZap API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resumos', resumosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/intellichat', intellichatRoutes);
app.use('/', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await createConnection();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 InteliZap API running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'all origins'}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: Supabase (${process.env.SUPABASE_URL})`);
      console.log('\n📚 Available endpoints:');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/auth/register');
      console.log('  GET  /api/usuarios/:id');
      console.log('  PUT  /api/usuarios/:id');
      console.log('  GET  /api/grupos');
      console.log('  POST /api/grupos');
      console.log('  GET  /api/mensagens');
      console.log('  POST /api/mensagens');
      console.log('  GET  /api/dashboard/stats');
      console.log('  GET  /api/dashboard/activity');
      console.log('  GET  /api/resumos');
      console.log('  POST /api/resumos');
      console.log('  POST /api/resumos/gerar');
      console.log('  GET  /api/admin/stats');
      console.log('  GET  /api/admin/users');
      console.log('  PUT  /api/admin/users/:id/plan');
      console.log('  GET  /api/admin/logs');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server gracefully...');
  process.exit(0);
});

// Start the server
startServer();