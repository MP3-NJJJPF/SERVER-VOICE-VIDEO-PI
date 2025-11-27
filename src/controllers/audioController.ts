import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import audioService from '../services/audioService';

/**
 * Obtener streams de audio activos de una reunión
 * GET /api/audio/meetings/:meetingId/streams
 */
export const getMeetingAudioStreams = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const streams = await audioService.getMeetingAudioStreams(meetingId);

    res.json({ success: true, streams });
  } catch (error) {
    console.error('❌ Error obteniendo streams:', error);
    res.status(500).json({ error: 'Error obteniendo streams de audio' });
  }
};

/**
 * Obtener detalles de un stream de audio
 * GET /api/audio/streams/:streamId
 */
export const getAudioStream = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;

    const stream = await audioService.getAudioStream(streamId);
    if (!stream) {
      res.status(404).json({ error: 'Stream no encontrado' });
      return;
    }

    res.json({ success: true, stream });
  } catch (error) {
    console.error('❌ Error obteniendo stream:', error);
    res.status(500).json({ error: 'Error obteniendo el stream' });
  }
};

/**
 * Detener un stream de audio
 * POST /api/audio/streams/:streamId/stop
 */
export const stopAudioStream = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;

    const stopped = await audioService.stopAudioStream(streamId);
    if (!stopped) {
      res.status(404).json({ error: 'Stream no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Stream detenido' });
  } catch (error) {
    console.error('❌ Error deteniendo stream:', error);
    res.status(500).json({ error: 'Error deteniendo el stream' });
  }
};

/**
 * Cambiar la calidad del audio
 * PUT /api/audio/streams/:streamId/quality
 */
export const setAudioQuality = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;
    const { quality } = req.body;

    if (!['low', 'medium', 'high'].includes(quality)) {
      res.status(400).json({ error: 'Calidad inválida. Use: low, medium, high' });
      return;
    }

    const updated = await audioService.setAudioQuality(streamId, quality);
    if (!updated) {
      res.status(404).json({ error: 'Stream no encontrado' });
      return;
    }

    res.json({ success: true, message: `Calidad ajustada a ${quality}` });
  } catch (error) {
    console.error('❌ Error ajustando calidad:', error);
    res.status(500).json({ error: 'Error ajustando la calidad' });
  }
};
