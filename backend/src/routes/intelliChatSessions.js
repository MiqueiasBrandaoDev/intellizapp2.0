import express from 'express';
import {
  getUserSessions,
  getOrCreateActiveSession,
  createNewSession,
  getSessionMessages,
  saveMessage,
  updateSessionTitle
} from '../controllers/intelliChatSessionsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all sessions for a user
router.get('/sessions', getUserSessions);

// Get or create active session
router.get('/sessions/active', getOrCreateActiveSession);

// Create new session
router.post('/sessions/new', createNewSession);

// Update session title
router.patch('/sessions/:session_id/title', updateSessionTitle);

// Get messages from a session
router.get('/sessions/:session_id/messages', getSessionMessages);

// Save a message
router.post('/messages', saveMessage);

export default router;
