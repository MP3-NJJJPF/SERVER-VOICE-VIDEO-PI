import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import videoService from '../services/videoService';

/**
 * Obtener streams de video activos de una reunión
 * GET /api/video/meetings/:meetingId/streams
 */
export const getMeetingVideoStreams = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const streams = await videoService.getMeetingVideoStreams(meetingId);

    res.json({ success: true, streams });
  } catch (error) {
    console.error('Error obteniendo video streams:', error);
    res.status(500).json({ error: 'Error obteniendo streams de video' });
  }
};

/**
 * Obtener detalles de un stream de video
 * GET /api/video/streams/:streamId
 */
export const getVideoStream = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;

    const stream = await videoService.getVideoStream(streamId);
    if (!stream) {
      res.status(404).json({ error: 'Video stream no encontrado' });
      return;
    }

    res.json({ success: true, stream });
  } catch (error) {
    console.error('Error obteniendo video stream:', error);
    res.status(500).json({ error: 'Error obteniendo el stream de video' });
  }
};

/**
 * Detener un stream de video
 * POST /api/video/streams/:streamId/stop
 */
export const stopVideoStream = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;

    const stopped = await videoService.stopVideoStream(streamId);
    if (!stopped) {
      res.status(404).json({ error: 'Video stream no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Video stream detenido' });
  } catch (error) {
    console.error('Error deteniendo video stream:', error);
    res.status(500).json({ error: 'Error deteniendo el stream de video' });
  }
};

/**
 * Cambiar la calidad del video
 * PUT /api/video/streams/:streamId/quality
 */
export const setVideoQuality = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { streamId } = req.params;
    const { quality } = req.body;

    if (!['low', 'medium', 'high', 'hd'].includes(quality)) {
      res.status(400).json({ error: 'Calidad inválida. Use: low, medium, high, hd' });
      return;
    }

    const updated = await videoService.setVideoQuality(streamId, quality);
    if (!updated) {
      res.status(404).json({ error: 'Video stream no encontrado' });
      return;
    }

    res.json({ success: true, message: `Calidad de video ajustada a ${quality}` });
  } catch (error) {
    console.error('Error ajustando calidad de video:', error);
    res.status(500).json({ error: 'Error ajustando la calidad del video' });
  }
};
