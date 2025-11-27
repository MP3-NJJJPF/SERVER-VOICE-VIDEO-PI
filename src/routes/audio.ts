import { Router } from 'express';
import { authMiddleware, requireAuth } from '../middlewares/auth';
import * as audioController from '../controllers/audioController';

const router = Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);
router.use(requireAuth);

/**
 * Audio Streams Management
 */

// Obtener todos los streams activos de una reunión
router.get('/meetings/:meetingId/streams', audioController.getMeetingAudioStreams);

// Obtener detalles de un stream
router.get('/streams/:streamId', audioController.getAudioStream);

// Detener un stream
router.post('/streams/:streamId/stop', audioController.stopAudioStream);

// Cambiar calidad del audio
router.put('/streams/:streamId/quality', audioController.setAudioQuality);

export default router;
