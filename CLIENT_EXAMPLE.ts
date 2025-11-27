/**
 * EJEMPLO DE CLIENTE - Cómo conectarse al servidor de voz
 * Este archivo muestra cómo integrar el cliente con el servidor de voz
 */

// ============================================
// INSTALACIÓN DE DEPENDENCIAS EN EL CLIENTE
// ============================================
// npm install socket.io-client firebase

// ============================================
// EJEMPLO DE USO EN CLIENTE
// ============================================

import { io } from 'socket.io-client';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// Configuración de Firebase (usa la misma que en el servidor)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ============================================
// CLASE DE CLIENTE DE VOZ
// ============================================

class VoiceClient {
  private socket: any;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private currentMeetingId: string | null = null;
  private userId: string | null = null;

  constructor(private serverUrl: string = 'http://localhost:3001') {}

  /**
   * Conectar al servidor y autenticarse
   */
  async connect(email: string, password: string): Promise<void> {
    try {
      // Autenticarse en Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      this.userId = userCredential.user.uid;

      // Conectar al servidor WebSocket
      this.socket = io(this.serverUrl, {
        auth: {
          token: idToken,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.setupSocketListeners();
      console.log('✅ Conectado al servidor de voz');
    } catch (error) {
      console.error('❌ Error conectando:', error);
      throw error;
    }
  }

  /**
   * Unirse a una reunión
   */
  async joinMeeting(meetingId: string): Promise<void> {
    try {
      this.currentMeetingId = meetingId;

      // Obtener stream de micrófono
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Notificar al servidor
      this.socket.emit('join-meeting', {
        userId: this.userId,
        meetingId,
      });

      console.log('✅ Uniéndose a reunión:', meetingId);
    } catch (error) {
      console.error('❌ Error uniéndose a reunión:', error);
      throw error;
    }
  }

  /**
   * Salir de la reunión
   */
  leaveMeeting(): void {
    if (this.currentMeetingId) {
      this.socket.emit('leave-meeting', {
        userId: this.userId,
        meetingId: this.currentMeetingId,
      });

      // Detener stream local
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      // Cerrar todas las conexiones P2P
      this.peerConnections.forEach((connection) => {
        connection.close();
      });
      this.peerConnections.clear();

      console.log('✅ Salido de la reunión');
    }
  }

  /**
   * Crear oferta WebRTC para otro usuario
   */
  private async createWebRTCConnection(remoteUserId: string): Promise<void> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      this.peerConnections.set(remoteUserId, peerConnection);

      // Agregar tracks de audio local
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, this.localStream!);
        });
      }

      // Manejar ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            from: this.userId,
            to: remoteUserId,
            candidate: event.candidate,
            meetingId: this.currentMeetingId,
          });
        }
      };

      // Manejar cambios de conexión
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `Conexión con ${remoteUserId}:`,
          peerConnection.connectionState
        );
      };

      // Manejar tracks remotos
      peerConnection.ontrack = (event) => {
        console.log('🔊 Track remoto recibido:', event.track.kind);
        // Reproducir audio remoto
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
      };

      // Crear oferta
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Enviar oferta al otro usuario
      this.socket.emit('webrtc-offer', {
        from: this.userId,
        to: remoteUserId,
        offer,
        meetingId: this.currentMeetingId,
      });

      console.log(`📤 Oferta WebRTC enviada a ${remoteUserId}`);
    } catch (error) {
      console.error('❌ Error creando conexión WebRTC:', error);
    }
  }

  /**
   * Configurar listeners de Socket.io
   */
  private setupSocketListeners(): void {
    // Usuario se unió a la reunión
    this.socket.on('user-joined', (data: any) => {
      console.log('👤 Usuario se unió:', data.userId);
      // Crear conexión con el nuevo usuario
      this.createWebRTCConnection(data.userId);
    });

    // WebRTC Offer recibido
    this.socket.on('webrtc-offer', async (data: any) => {
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });

        this.peerConnections.set(data.from, peerConnection);

        // Agregar tracks locales
        if (this.localStream) {
          this.localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, this.localStream!);
          });
        }

        // Manejar ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.socket.emit('ice-candidate', {
              from: this.userId,
              to: data.from,
              candidate: event.candidate,
              meetingId: this.currentMeetingId,
            });
          }
        };

        // Manejar tracks remotos
        peerConnection.ontrack = (event) => {
          console.log('🔊 Track remoto recibido:', event.track.kind);
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.play();
        };

        // Configurar descripción remota
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        // Crear respuesta
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Enviar respuesta
        this.socket.emit('webrtc-answer', {
          from: this.userId,
          to: data.from,
          answer,
          meetingId: this.currentMeetingId,
        });

        console.log(`📥 Oferta recibida de ${data.from}, respuesta enviada`);
      } catch (error) {
        console.error('❌ Error manejando oferta WebRTC:', error);
      }
    });

    // WebRTC Answer recibido
    this.socket.on('webrtc-answer', async (data: any) => {
      try {
        const peerConnection = this.peerConnections.get(data.from);
        if (peerConnection) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log(`📥 Respuesta recibida de ${data.from}`);
        }
      } catch (error) {
        console.error('❌ Error manejando respuesta WebRTC:', error);
      }
    });

    // ICE Candidate recibido
    this.socket.on('ice-candidate', async (data: any) => {
      try {
        const peerConnection = this.peerConnections.get(data.from);
        if (peerConnection && data.candidate) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error('❌ Error agregando ICE candidate:', error);
      }
    });

    // Usuario se fue
    this.socket.on('user-left', (data: any) => {
      console.log('👤 Usuario se fue:', data.userId);
      const peerConnection = this.peerConnections.get(data.userId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(data.userId);
      }
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    this.leaveMeeting();
    if (this.socket) {
      this.socket.disconnect();
    }
    console.log('✅ Desconectado del servidor');
  }
}

// ============================================
// EJEMPLO DE USO
// ============================================

async function main() {
  const client = new VoiceClient('http://localhost:3001');

  try {
    // Conectarse al servidor
    await client.connect('user@example.com', 'password123');

    // Esperar a que se conecte
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Unirse a una reunión
    await client.joinMeeting('meeting-uuid-here');

    // Mantener la conexión activa
    console.log('Conectado a la reunión. Presiona Ctrl+C para salir.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar ejemplo (descomentar para pruebas)
// main();

export default VoiceClient;
