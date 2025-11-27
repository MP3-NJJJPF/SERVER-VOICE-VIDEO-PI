import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import meetingService from '../services/meetingService';
import audioService from '../services/audioService';

/**
 * Crear una nueva reunión de audio
 * POST /api/meetings
 */
export const createMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, maxParticipants } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'El nombre de la reunión es requerido' });
      return;
    }

    const meeting = await meetingService.createMeeting(
      name,
      userId,
      maxParticipants || 50
    );

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error('❌ Error creando reunión:', error);
    res.status(500).json({ error: 'Error creando la reunión' });
  }
};

/**
 * Obtener detalles de una reunión
 * GET /api/meetings/:meetingId
 */
export const getMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Reunión no encontrada' });
      return;
    }

    res.json({ success: true, meeting });
  } catch (error) {
    console.error('❌ Error obteniendo reunión:', error);
    res.status(500).json({ error: 'Error obteniendo la reunión' });
  }
};

/**
 * Unirse a una reunión
 * POST /api/meetings/:meetingId/join
 */
export const joinMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Reunión no encontrada' });
      return;
    }

    if (!meeting.isActive) {
      res.status(410).json({ error: 'La reunión ha finalizado' });
      return;
    }

    const added = await meetingService.addParticipant(meetingId, userId);
    if (!added) {
      res.status(400).json({ error: 'No se pudo unir a la reunión' });
      return;
    }

    // Crear stream de audio
    const audioStream = await audioService.createAudioStream(meetingId, userId, 'high');

    res.json({ success: true, meeting, audioStream });
  } catch (error) {
    console.error('❌ Error uniéndose a reunión:', error);
    res.status(500).json({ error: 'Error uniéndose a la reunión' });
  }
};

/**
 * Salir de una reunión
 * POST /api/meetings/:meetingId/leave
 */
export const leaveMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    await meetingService.removeParticipant(meetingId, userId);

    res.json({ success: true, message: 'Salido de la reunión' });
  } catch (error) {
    console.error('❌ Error saliendo de reunión:', error);
    res.status(500).json({ error: 'Error saliendo de la reunión' });
  }
};

/**
 * Finalizar una reunión
 * POST /api/meetings/:meetingId/end
 */
export const endMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Reunión no encontrada' });
      return;
    }

    // Solo el creador puede finalizar
    if (meeting.creatorId !== userId) {
      res.status(403).json({ error: 'Solo el creador puede finalizar la reunión' });
      return;
    }

    await meetingService.endMeeting(meetingId);

    res.json({ success: true, message: 'Reunión finalizada' });
  } catch (error) {
    console.error('❌ Error finalizando reunión:', error);
    res.status(500).json({ error: 'Error finalizando la reunión' });
  }
};

/**
 * Obtener participantes de una reunión
 * GET /api/meetings/:meetingId/participants
 */
export const getMeetingParticipants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const participants = await meetingService.getMeetingParticipants(meetingId);

    res.json({ success: true, participants });
  } catch (error) {
    console.error('❌ Error obteniendo participantes:', error);
    res.status(500).json({ error: 'Error obteniendo participantes' });
  }
};

/**
 * Obtener reuniones activas
 * GET /api/meetings/active
 */
export const getActiveMeetings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const meetings = await meetingService.getActiveMeetings();

    res.json({ success: true, meetings });
  } catch (error) {
    console.error('❌ Error obteniendo reuniones activas:', error);
    res.status(500).json({ error: 'Error obteniendo reuniones' });
  }
};
