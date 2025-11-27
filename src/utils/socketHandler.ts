import { Socket, Server as SocketIOServer } from 'socket.io';
import { WebRTCOffer, WebRTCAnswer, ICECandidate } from '../models/types';
import meetingService from '../services/meetingService';

class SocketIOHandler {
  private io: SocketIOServer;
  // Map para mantener track de socket IDs por user ID
  private userSockets: Map<string, string[]> = new Map();
  // Map para mantener track de meetings por socket ID
  private socketMeetings: Map<string, string> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Cliente conectado: ${socket.id}`);

      // Evento: Usuario se une a una reunión
      socket.on('join-meeting', (data: { userId: string; meetingId: string }) => {
        this.handleJoinMeeting(socket, data);
      });

      // Evento: Usuario se desconecta de una reunión
      socket.on('leave-meeting', (data: { userId: string; meetingId: string }) => {
        this.handleLeaveMeeting(socket, data);
      });

      // Evento: WebRTC Offer (usuario A ofrece conexión a usuario B)
      socket.on('webrtc-offer', (data: WebRTCOffer) => {
        this.handleWebRTCOffer(socket, data);
      });

      // Evento: WebRTC Answer (usuario B responde a usuario A)
      socket.on('webrtc-answer', (data: WebRTCAnswer) => {
        this.handleWebRTCAnswer(socket, data);
      });

      // Evento: ICE Candidate (para establecer la conexión)
      socket.on('ice-candidate', (data: ICECandidate) => {
        this.handleICECandidate(socket, data);
      });

      // Evento: Test de latencia
      socket.on('ping', (callback) => {
        callback('pong');
      });

      // Evento: Desconexión
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Manejar unirse a una reunión
   */
  private handleJoinMeeting(
    socket: Socket,
    data: { userId: string; meetingId: string }
  ): void {
    const { userId, meetingId } = data;

    // Registrar el socket del usuario
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(socket.id);
    this.socketMeetings.set(socket.id, meetingId);

    // Unir el socket a una sala de Socket.io
    socket.join(`meeting-${meetingId}`);

    console.log(`👤 ${userId} se unió a la reunión ${meetingId}`);

    // Notificar a otros usuarios que un nuevo usuario se unió
    socket.to(`meeting-${meetingId}`).emit('user-joined', {
      userId,
      socketId: socket.id,
      message: `${userId} se unió a la reunión`,
    });

    // Enviar lista de usuarios activos
    socket.emit('meeting-users', {
      users: Array.from(
        new Set(
          Array.from(this.io.sockets.adapter.rooms.get(`meeting-${meetingId}`) || [])
        )
      ),
    });
  }

  /**
   * Manejar salir de una reunión
   */
  private handleLeaveMeeting(
    socket: Socket,
    data: { userId: string; meetingId: string }
  ): void {
    const { userId, meetingId } = data;

    socket.leave(`meeting-${meetingId}`);
    this.socketMeetings.delete(socket.id);

    // Remover socket del usuario
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const index = sockets.indexOf(socket.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    console.log(`👤 ${userId} salió de la reunión ${meetingId}`);

    // Notificar a otros usuarios
    socket.to(`meeting-${meetingId}`).emit('user-left', {
      userId,
      message: `${userId} salió de la reunión`,
    });
  }

  /**
   * Manejar WebRTC Offer
   */
  private handleWebRTCOffer(socket: Socket, data: WebRTCOffer): void {
    const targetSockets = this.userSockets.get(data.to) || [];

    targetSockets.forEach((targetSocketId) => {
      this.io.to(targetSocketId).emit('webrtc-offer', {
        from: data.from,
        offer: data.offer,
        meetingId: data.meetingId,
      });
    });

    console.log(`🎙️ WebRTC Offer de ${data.from} para ${data.to}`);
  }

  /**
   * Manejar WebRTC Answer
   */
  private handleWebRTCAnswer(socket: Socket, data: WebRTCAnswer): void {
    const targetSockets = this.userSockets.get(data.to) || [];

    targetSockets.forEach((targetSocketId) => {
      this.io.to(targetSocketId).emit('webrtc-answer', {
        from: data.from,
        answer: data.answer,
        meetingId: data.meetingId,
      });
    });

    console.log(`🎙️ WebRTC Answer de ${data.from} para ${data.to}`);
  }

  /**
   * Manejar ICE Candidate
   */
  private handleICECandidate(socket: Socket, data: ICECandidate): void {
    const targetSockets = this.userSockets.get(data.to) || [];

    targetSockets.forEach((targetSocketId) => {
      this.io.to(targetSocketId).emit('ice-candidate', {
        from: data.from,
        candidate: data.candidate,
        meetingId: data.meetingId,
      });
    });
  }

  /**
   * Manejar desconexión
   */
  private handleDisconnect(socket: Socket): void {
    const meetingId = this.socketMeetings.get(socket.id);

    // Encontrar el usuario de este socket
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socket.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }

        if (meetingId) {
          socket.to(`meeting-${meetingId}`).emit('user-disconnected', {
            userId,
            message: `${userId} se desconectó`,
          });
        }

        console.log(`❌ Usuario ${userId} desconectado`);
        break;
      }
    }

    this.socketMeetings.delete(socket.id);
  }

  /**
   * Obtener usuarios en una reunión
   */
  public getUsersInMeeting(meetingId: string): string[] {
    const sockets = this.io.sockets.adapter.rooms.get(`meeting-${meetingId}`) || new Set();
    return Array.from(sockets);
  }

  /**
   * Enviar mensaje a una reunión completa
   */
  public broadcastToMeeting(meetingId: string, event: string, data: any): void {
    this.io.to(`meeting-${meetingId}`).emit(event, data);
  }

  /**
   * Obtener número de usuarios conectados
   */
  public getConnectedUsers(): number {
    return this.userSockets.size;
  }
}

export default SocketIOHandler;
