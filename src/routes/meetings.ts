import { Router } from 'express';
import { authMiddleware, requireAuth } from '../middlewares/auth';
import * as meetingController from '../controllers/meetingController';

const router = Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);
router.use(requireAuth);

/**
 * Reuniones - Meeting Management
 */

// Crear nueva reunión
router.post('/', meetingController.createMeeting);

// Obtener reuniones activas
router.get('/active', meetingController.getActiveMeetings);

// Obtener detalles de una reunión
router.get('/:meetingId', meetingController.getMeeting);

// Obtener participantes de una reunión
router.get('/:meetingId/participants', meetingController.getMeetingParticipants);

// Unirse a una reunión
router.post('/:meetingId/join', meetingController.joinMeeting);

// Salir de una reunión
router.post('/:meetingId/leave', meetingController.leaveMeeting);

// Finalizar una reunión
router.post('/:meetingId/end', meetingController.endMeeting);

export default router;
