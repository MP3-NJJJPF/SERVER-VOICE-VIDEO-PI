import { v4 as uuidv4 } from 'uuid';
import { Meeting } from '../models/types';
import { firebaseDb } from '../config/firebase';

class MeetingService {
  private meetings: Map<string, Meeting> = new Map();

  /**
   * Crear una nueva reunión de audio
   */
  async createMeeting(
    name: string,
    creatorId: string,
    maxParticipants: number = 50
  ): Promise<Meeting> {
    const meetingId = uuidv4();
    const meeting: Meeting = {
      id: meetingId,
      name,
      creatorId,
      participants: [creatorId],
      isActive: true,
      startedAt: new Date(),
      maxParticipants,
      recordingEnabled: false,
    };

    this.meetings.set(meetingId, meeting);

    // Guardar en Firestore (si está disponible)
    if (firebaseDb) {
      try {
        await firebaseDb.collection('meetings').doc(meetingId).set(meeting);
        console.log(`✅ Reunión creada y guardada en Firestore: ${meetingId}`);
      } catch (error) {
        console.error('❌ Error guardando reunión en Firestore:', error);
      }
    } else {
      console.log(`✅ Reunión creada (solo en memoria): ${meetingId}`);
    }

    return meeting;
  }

  /**
   * Obtener una reunión por ID
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    if (this.meetings.has(meetingId)) {
      return this.meetings.get(meetingId) || null;
    }

    // Intentar obtener de Firestore si está disponible
    if (firebaseDb) {
      try {
        const doc = await firebaseDb.collection('meetings').doc(meetingId).get();
        if (doc.exists) {
          const meeting = doc.data() as Meeting;
          this.meetings.set(meetingId, meeting);
          return meeting;
        }
      } catch (error) {
        console.error('❌ Error obteniendo reunión:', error);
      }
    }

    return null;
  }

  /**
   * Agregar participante a una reunión
   */
  async addParticipant(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) return false;

    if (
      meeting.maxParticipants &&
      meeting.participants.length >= meeting.maxParticipants
    ) {
      console.warn(`❌ Reunión llena: ${meetingId}`);
      return false;
    }

    if (!meeting.participants.includes(userId)) {
      meeting.participants.push(userId);
      this.meetings.set(meetingId, meeting);

      if (firebaseDb) {
        try {
          await firebaseDb
            .collection('meetings')
            .doc(meetingId)
            .update({ participants: meeting.participants });
        } catch (error) {
          console.error('❌ Error agregando participante:', error);
        }
      }
      console.log(`✅ Participante agregado: ${userId} a ${meetingId}`);
      return true;
    }

    return true;
  }

  /**
   * Remover participante de una reunión
   */
  async removeParticipant(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) return false;

    meeting.participants = meeting.participants.filter((id) => id !== userId);
    this.meetings.set(meetingId, meeting);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('meetings')
          .doc(meetingId)
          .update({ participants: meeting.participants });
      } catch (error) {
        console.error('❌ Error removiendo participante:', error);
      }
    }

    // Si no hay participantes, finalizar la reunión
    if (meeting.participants.length === 0) {
      await this.endMeeting(meetingId);
    }

    console.log(`✅ Participante removido: ${userId} de ${meetingId}`);
    return true;
  }

  /**
   * Finalizar una reunión
   */
  async endMeeting(meetingId: string): Promise<boolean> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) return false;

    meeting.isActive = false;
    meeting.endedAt = new Date();
    this.meetings.set(meetingId, meeting);

    if (firebaseDb) {
      try {
        await firebaseDb
          .collection('meetings')
          .doc(meetingId)
          .update({ isActive: false, endedAt: new Date() });
      } catch (error) {
        console.error('❌ Error finalizando reunión:', error);
      }
    }
    console.log(`✅ Reunión finalizada: ${meetingId}`);
    return true;
  }

  /**
   * Obtener todas las reuniones activas
   */
  async getActiveMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter((m) => m.isActive);
  }

  /**
   * Obtener participantes de una reunión
   */
  async getMeetingParticipants(meetingId: string): Promise<string[]> {
    const meeting = await this.getMeeting(meetingId);
    return meeting?.participants || [];
  }
}

export default new MeetingService();
