import { v4 as uuidv4 } from 'uuid';
import { AudioStream } from '../models/types';
import { firebaseDb } from '../config/firebase';

class AudioService {
  private audioStreams: Map<string, AudioStream> = new Map();

  /**
   * Crear un stream de audio
   */
  async createAudioStream(
    meetingId: string,
    userId: string,
    quality: 'low' | 'medium' | 'high' = 'high'
  ): Promise<AudioStream> {
    const streamId = uuidv4();
    const stream: AudioStream = {
      meetingId,
      userId,
      streamId,
      isActive: true,
      quality,
      startedAt: new Date(),
    };

    this.audioStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('audioStreams')
          .doc(streamId)
          .set(stream);
      } catch (error) {
        console.error('Error creando stream:', error);
      }
    }
    console.log(`Stream de audio creado: ${streamId}`);

    return stream;
  }

  /**
   * Obtener un stream de audio
   */
  async getAudioStream(streamId: string): Promise<AudioStream | null> {
    if (this.audioStreams.has(streamId)) {
      return this.audioStreams.get(streamId) || null;
    }

    if (firebaseDb) {
      try {
        const doc = await firebaseDb.collection('audioStreams').doc(streamId).get();
        if (doc.exists) {
          const stream = doc.data() as AudioStream;
          this.audioStreams.set(streamId, stream);
          return stream;
        }
      } catch (error) {
        console.error('Error obteniendo stream:', error);
      }
    }

    return null;
  }

  /**
   * Obtener todos los streams activos de una reunión
   */
  async getMeetingAudioStreams(meetingId: string): Promise<AudioStream[]> {
    return Array.from(this.audioStreams.values()).filter(
      (s) => s.meetingId === meetingId && s.isActive
    );
  }

  /**
   * Detener un stream de audio
   */
  async stopAudioStream(streamId: string): Promise<boolean> {
    const stream = await this.getAudioStream(streamId);
    if (!stream) return false;

    stream.isActive = false;
    stream.endedAt = new Date();
    this.audioStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('audioStreams')
          .doc(streamId)
          .update({ isActive: false, endedAt: new Date() });
      } catch (error) {
        console.error('Error deteniendo stream:', error);
      }
    }
    console.log(`Stream detenido: ${streamId}`);
    return true;
  }

  /**
   * Cambiar calidad del audio
   */
  async setAudioQuality(
    streamId: string,
    quality: 'low' | 'medium' | 'high'
  ): Promise<boolean> {
    const stream = await this.getAudioStream(streamId);
    if (!stream) return false;

    stream.quality = quality;
    this.audioStreams.set(streamId, stream);

    if (firebaseDb) {
      try {
        await firebaseDb.collection('audioStreams').doc(streamId).update({ quality });
      } catch (error) {
        console.error('Error ajustando calidad:', error);
      }
    }
    console.log(`Calidad de audio ajustada: ${quality} para ${streamId}`);
    return true;
  }

  /**
   * Limpiar streams inactivos
   */
  async cleanupInactiveStreams(): Promise<number> {
    let count = 0;
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutos

    for (const [streamId, stream] of this.audioStreams.entries()) {
      if (
        !stream.isActive &&
        stream.endedAt &&
        now - stream.endedAt.getTime() > timeout
      ) {
        this.audioStreams.delete(streamId);
        count++;
      }
    }

    console.log(`${count} streams inactivos limpiados`);
    return count;
  }
}

export default new AudioService();
