import { v4 as uuidv4 } from 'uuid';
import { Meeting } from '../models/types';
import { firebaseDb } from '../config/firebase';

/**
 * Meeting Service
 * @class MeetingService
 * @description Manages meeting creation, participants, and lifecycle
 */
class MeetingService {
  private meetings: Map<string, Meeting> = new Map();

  /**
   * Create a new audio meeting
   * @param {string} name - Meeting name
   * @param {string} creatorId - User ID of the meeting creator
   * @param {number} [maxParticipants=50] - Maximum number of participants allowed
   * @returns {Promise<Meeting>} The created meeting object
   * @example
   * const meeting = await meetingService.createMeeting('Team Call', 'user123', 10);
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
   * Get a meeting by ID
   * @param {string} meetingId - Unique meeting identifier
   * @returns {Promise<Meeting | null>} Meeting object or null if not found
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
   * Add a participant to a meeting
   * @param {string} meetingId - Meeting identifier
   * @param {string} userId - User ID to add
   * @returns {Promise<boolean>} True if participant was added successfully
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
   * Remove a participant from a meeting
   * @param {string} meetingId - Meeting identifier
   * @param {string} userId - User ID to remove
   * @returns {Promise<boolean>} True if participant was removed successfully
   * @description Automatically ends the meeting if no participants remain
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
   * End a meeting and mark it as inactive
   * @param {string} meetingId - Meeting identifier
   * @returns {Promise<boolean>} True if meeting was ended successfully
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
        console.error('❌ Error ending meeting:', error);
      }
    }
    console.log(`✅ Meeting ended: ${meetingId}`);
    return true;
  }

  /**
   * Get all active meetings
   * @returns {Promise<Meeting[]>} Array of active meeting objects
   */
  async getActiveMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter((m) => m.isActive);
  }

  /**
   * Get all participants of a meeting
   * @param {string} meetingId - Meeting identifier
   * @returns {Promise<string[]>} Array of participant user IDs
   */
  async getMeetingParticipants(meetingId: string): Promise<string[]> {
    const meeting = await this.getMeeting(meetingId);
    return meeting?.participants || [];
  }
}

export default new MeetingService();
