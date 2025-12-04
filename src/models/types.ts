/**
 * User entity interface
 * @interface User
 */
export interface User {
  /** User's unique identifier */
  id: string;
  /** Firebase authentication UID */
  uid: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** Optional profile photo URL */
  photoURL?: string;
  /** Current online status */
  isOnline: boolean;
  /** Current meeting ID if user is in a meeting */
  currentMeetingId?: string;
  /** Account creation timestamp */
  createdAt: Date;
}

/**
 * Meeting entity interface
 * @interface Meeting
 */
export interface Meeting {
  /** Meeting's unique identifier */
  id: string;
  /** Meeting name/title */
  name: string;
  /** User ID of the meeting creator */
  creatorId: string;
  /** Array of participant user IDs */
  participants: string[];
  /** Whether the meeting is currently active */
  isActive: boolean;
  /** Meeting start timestamp */
  startedAt: Date;
  /** Meeting end timestamp (if ended) */
  endedAt?: Date;
  /** Maximum number of participants allowed */
  maxParticipants?: number;
  /** Whether recording is enabled for this meeting */
  recordingEnabled?: boolean;
}

/**
 * Audio stream entity interface
 * @interface AudioStream
 */
export interface AudioStream {
  meetingId: string;
  userId: string;
  streamId: string;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  startedAt: Date;
  endedAt?: Date;
}

/**
 * WebRTC Offer interface for signaling
 * @interface WebRTCOffer
 * @description Server only handles signaling, doesn't create actual connections
 */
export interface WebRTCOffer {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit; // RTCSessionDescriptionInit del cliente
  meetingId: string;
}

/**
 * WebRTC Answer interface for signaling
 * @interface WebRTCAnswer
 */
export interface WebRTCAnswer {
  from: string;
  to: string;
  answer: RTCSessionDescriptionInit; // RTCSessionDescriptionInit del cliente
  meetingId: string;
}

/**
 * ICE Candidate interface for WebRTC connection establishment
 * @interface ICECandidate
 */
export interface ICECandidate {
  from: string;
  to: string;
  candidate: RTCIceCandidateInit; // RTCIceCandidate del cliente
  meetingId: string;
}

/**
 * RTC Session Description Init interface
 * @interface RTCSessionDescriptionInit
 * @description WebRTC types that TypeScript may not recognize in Node.js
 */
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

/**
 * RTC ICE Candidate Init interface
 * @interface RTCIceCandidateInit
 */
export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}
