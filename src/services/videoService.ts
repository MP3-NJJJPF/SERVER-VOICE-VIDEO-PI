import { v4 as uuidv4 } from 'uuid';
import { VideoStream } from '../models/types';
import { firebaseDb } from '../config/firebase';

class VideoService {
  private videoStreams: Map<string, VideoStream> = new Map();

  /**
   * Crear un stream de video
   */
  async createVideoStream(
    meetingId: string,
    userId: string,
    quality: 'low' | 'medium' | 'high' | 'hd' = 'high'
  ): Promise<VideoStream> {
    const streamId = uuidv4();
    
    // Definir resolución según calidad
    const resolutionMap = {
      low: '320x240',
      medium: '640x480',
      high: '1280x720',
      hd: '1920x1080'
    };

    const stream: VideoStream = {
      meetingId,
      userId,
      streamId,
      isActive: true,
      quality,
      resolution: resolutionMap[quality],
      startedAt: new Date(),
    };

    this.videoStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('videoStreams')
          .doc(streamId)
          .set(stream);
      } catch (error) {
        console.error('Error creando video stream:', error);
      }
    }
    console.log(`Stream de video creado: ${streamId} - ${quality} (${resolutionMap[quality]})`);

    return stream;
  }

  /**
   * Obtener un stream de video
   */
  async getVideoStream(streamId: string): Promise<VideoStream | null> {
    if (this.videoStreams.has(streamId)) {
      return this.videoStreams.get(streamId) || null;
    }

    if (firebaseDb) {
      try {
        const doc = await firebaseDb.collection('videoStreams').doc(streamId).get();
        if (doc.exists) {
          const stream = doc.data() as VideoStream;
          this.videoStreams.set(streamId, stream);
          return stream;
        }
      } catch (error) {
        console.error('Error obteniendo video stream:', error);
      }
    }

    return null;
  }

  /**
   * Obtener todos los streams de video activos de una reunión
   */
  async getMeetingVideoStreams(meetingId: string): Promise<VideoStream[]> {
    return Array.from(this.videoStreams.values()).filter(
      (s) => s.meetingId === meetingId && s.isActive
    );
  }

  /**
   * Detener un stream de video
   */
  async stopVideoStream(streamId: string): Promise<boolean> {
    const stream = await this.getVideoStream(streamId);
    if (!stream) return false;

    stream.isActive = false;
    stream.endedAt = new Date();
    this.videoStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('videoStreams')
          .doc(streamId)
          .update({ isActive: false, endedAt: new Date() });
      } catch (error) {
        console.error('Error deteniendo video stream:', error);
      }
    }
    console.log(`Stream de video detenido: ${streamId}`);
    return true;
  }

  /**
   * Cambiar calidad del video
   */
  async setVideoQuality(
    streamId: string,
    quality: 'low' | 'medium' | 'high' | 'hd'
  ): Promise<boolean> {
    const stream = await this.getVideoStream(streamId);
    if (!stream) return false;

    const resolutionMap = {
      low: '320x240',
      medium: '640x480',
      high: '1280x720',
      hd: '1920x1080'
    };

    stream.quality = quality;
    stream.resolution = resolutionMap[quality];
    this.videoStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb.collection('videoStreams').doc(streamId).update({ 
          quality,
          resolution: resolutionMap[quality]
        });
      } catch (error) {
        console.error('Error ajustando calidad de video:', error);
      }
    }
    console.log(`Calidad de video ajustada: ${quality} (${resolutionMap[quality]}) para ${streamId}`);
    return true;
  }

  /**
   * Limpiar streams de video inactivos
   */
  async cleanupInactiveStreams(): Promise<number> {
    let count = 0;
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutos

    for (const [streamId, stream] of this.videoStreams.entries()) {
      if (
        !stream.isActive &&
        stream.endedAt &&
        now - stream.endedAt.getTime() > timeout
      ) {
        this.videoStreams.delete(streamId);
        count++;
      }
    }

    console.log(`${count} video streams inactivos limpiados`);
    return count;
  }
}

export default new VideoService();
