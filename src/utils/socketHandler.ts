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
      console.log(`Cliente conectado: ${socket.id}`);

      // Evento: Usuario se une a una reunión (con callback)
      socket.on('join-meeting', (data: { userId: string; meetingId: string; userName?: string }, callback) => {
        console.log('join-meeting recibido:', data);
        try {
          this.handleJoinMeeting(socket, data);
          
          // Responder al cliente con éxito
          if (callback && typeof callback === 'function') {
            callback({ 
              success: true, 
              message: 'Joined successfully',
              meetingId: data.meetingId,
              userId: data.userId
            });
          }
        } catch (error: any) {
          console.error('Error en join-meeting:', error);
          if (callback && typeof callback === 'function') {
            callback({ 
              success: false, 
              error: error.message 
            });
          }
        }
      });

      // Evento: Usuario se desconecta de una reunión
      socket.on('leave-meeting', (data: { userId: string; meetingId: string }) => {
        console.log('leave-meeting recibido:', data);
        this.handleLeaveMeeting(socket, data);
      });

      // Evento: Toggle audio (mutear/desmutear)
      socket.on('toggle-audio', (data: { userId: string; meetingId: string; isMuted: boolean }) => {
        console.log('toggle-audio recibido:', data);
        socket.to(`meeting-${data.meetingId}`).emit('audio-state-changed', {
          userId: data.userId,
          isMuted: data.isMuted,
        });
      });

      // Evento: WebRTC Offer (usuario A ofrece conexión a usuario B)
      socket.on('webrtc-offer', (data: WebRTCOffer) => {
        console.log('webrtc-offer de', data.from, 'para', data.to);
        this.handleWebRTCOffer(socket, data);
      });

      // Evento: WebRTC Answer (usuario B responde a usuario A)
      socket.on('webrtc-answer', (data: WebRTCAnswer) => {
        console.log('webrtc-answer de', data.from, 'para', data.to);
        this.handleWebRTCAnswer(socket, data);
      });

      // Evento: ICE Candidate (para establecer la conexión)
      socket.on('ice-candidate', (data: ICECandidate) => {
        this.handleICECandidate(socket, data);
      });

      // Evento: Test de latencia
      socket.on('ping', (callback) => {
        if (callback && typeof callback === 'function') {
          callback('pong');
        }
      });

      // Evento: Desconexión
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Manejar unirse a una reunión
   */
  private handleJoinMeeting(
    socket: Socket,
    data: { userId: string; meetingId: string; userName?: string }
  ): void {
    const { userId, meetingId, userName } = data;

    // Registrar el socket del usuario
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(socket.id);
    this.socketMeetings.set(socket.id, meetingId);

    // Unir el socket a una sala de Socket.io
    socket.join(`meeting-${meetingId}`);

    console.log(`✅ ${userId} (${userName || 'Sin nombre'}) se unió a la reunión ${meetingId}`);

    // Obtener lista de usuarios ya en la sala (antes de que este se una)
    const roomSockets = this.io.sockets.adapter.rooms.get(`meeting-${meetingId}`) || new Set();
    const existingUsers: any[] = [];
    
    // Recopilar información de usuarios existentes
    for (const [existingUserId, sockets] of this.userSockets.entries()) {
      if (existingUserId !== userId) {
        for (const socketId of sockets) {
          if (roomSockets.has(socketId)) {
            existingUsers.push({
              userId: existingUserId,
              socketId: socketId,
              name: existingUserId, // Aquí podrías guardar el nombre en un Map si lo necesitas
            });
            break; // Solo necesitamos un socket por usuario
          }
        }
      }
    }

    // Enviar a este usuario la lista de participantes existentes
    if (existingUsers.length > 0) {
      console.log(`📋 Enviando ${existingUsers.length} usuarios existentes a ${userId}`);
      existingUsers.forEach(user => {
        socket.emit('user-joined', {
          userId: user.userId,
          socketId: user.socketId,
          name: user.name,
        });
      });
    }

    // Notificar a otros usuarios que un nuevo usuario se unió
    socket.to(`meeting-${meetingId}`).emit('user-joined', {
      userId,
      socketId: socket.id,
      name: userName || userId,
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

    console.log(`${userId} salió de la reunión ${meetingId}`);

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
        to: data.to,
        offer: data.offer,
        meetingId: data.meetingId,
      });
    });

    console.log(`WebRTC Offer de ${data.from} para ${data.to}`);
  }

  /**
   * Manejar WebRTC Answer
   */
  private handleWebRTCAnswer(socket: Socket, data: WebRTCAnswer): void {
    const targetSockets = this.userSockets.get(data.to) || [];

    targetSockets.forEach((targetSocketId) => {
      this.io.to(targetSocketId).emit('webrtc-answer', {
        from: data.from,
        to: data.to,
        answer: data.answer,
        meetingId: data.meetingId,
      });
    });

    console.log(`WebRTC Answer de ${data.from} para ${data.to}`);
  }

  /**
   * Manejar ICE Candidate
   */
  private handleICECandidate(socket: Socket, data: ICECandidate): void {
    const targetSockets = this.userSockets.get(data.to) || [];

    targetSockets.forEach((targetSocketId) => {
      this.io.to(targetSocketId).emit('ice-candidate', {
        from: data.from,
        to: data.to,
        candidate: data.candidate,
        meetingId: data.meetingId,
      });
    });

    console.log(`ICE Candidate de ${data.from} para ${data.to}`);
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
          socket.to(`meeting-${meetingId}`).emit('user-left', {
            userId,
            message: `${userId} se desconectó`,
          });
        }

        console.log(`Usuario ${userId} desconectado del socket ${socket.id}`);
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
