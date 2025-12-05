import { Router } from 'express';
import { authMiddleware, requireAuth } from '../middlewares/auth';
import * as videoController from '../controllers/videoController';

const router = Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);
router.use(requireAuth);

/**
 * Video Streams Management
 */

// Obtener todos los streams de video activos de una reunión
router.get('/meetings/:meetingId/streams', videoController.getMeetingVideoStreams);

// Obtener detalles de un video stream
router.get('/streams/:streamId', videoController.getVideoStream);

// Detener un video stream
router.post('/streams/:streamId/stop', videoController.stopVideoStream);

// Cambiar calidad del video
router.put('/streams/:streamId/quality', videoController.setVideoQuality);

export default router;
