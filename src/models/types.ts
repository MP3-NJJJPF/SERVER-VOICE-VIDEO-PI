export interface User {
  id: string;
  uid: string; // Firebase UID
  name: string;
  email: string;
  photoURL?: string;
  isOnline: boolean;
  currentMeetingId?: string;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  name: string;
  creatorId: string;
  participants: string[]; // Array de user IDs
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  maxParticipants?: number;
  recordingEnabled?: boolean;
}

export interface AudioStream {
  meetingId: string;
  userId: string;
  streamId: string;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  startedAt: Date;
  endedAt?: Date;
}

// Tipos para WebRTC (servidor solo maneja el signaling, no crea conexiones)
export interface WebRTCOffer {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit; // RTCSessionDescriptionInit del cliente
  meetingId: string;
}

export interface WebRTCAnswer {
  from: string;
  to: string;
  answer: RTCSessionDescriptionInit; // RTCSessionDescriptionInit del cliente
  meetingId: string;
}

export interface ICECandidate {
  from: string;
  to: string;
  candidate: RTCIceCandidateInit; // RTCIceCandidate del cliente
  meetingId: string;
}

// Tipos de WebRTC que TypeScript puede no reconocer en Node.js
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}
