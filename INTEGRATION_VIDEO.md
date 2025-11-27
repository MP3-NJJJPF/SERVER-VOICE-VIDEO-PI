# 📹 Guía de Integración: Servidor de Video

Este documento proporciona instrucciones para integrar un servidor de video con el servidor de voz actual.

## 🎯 Objetivo

Crear un servidor de video separado que funcione en conjunto con este servidor de voz, permitiendo transmisión simultánea de audio y video.

## 🏗️ Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (WEB/MOBILE)                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ VoiceClient + VideoClient                          │ │
│  │ - Audio WebRTC                                     │ │
│  │ - Video WebRTC                                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────┬──────────────────────────────┬────────────┘
              │                              │
              ▼                              ▼
    ┌─────────────────────┐      ┌──────────────────────┐
    │  SERVIDOR VOZ       │      │  SERVIDOR VIDEO      │
    │  (Este proyecto)    │      │  (Nuevo proyecto)    │
    │  - Socket.io        │      │  - Socket.io         │
    │  - Audio WebRTC     │      │  - Video WebRTC      │
    │  - Meeting Mgmt     │      │  - Stream Mgmt       │
    │  - Firebase Auth    │      │  - Firebase Auth     │
    └────────────────────┬┘      └──────────────┬───────┘
                         │                      │
                         └──────────┬───────────┘
                                    ▼
                        ┌────────────────────┐
                        │  FIREBASE (Shared) │
                        │  - Authentication  │
                        │  - Firestore DB    │
                        │  - Real-time Sync  │
                        └────────────────────┘
```

## 🚀 Pasos para Integrar Video

### 1. Crear Proyecto de Servidor de Video

```bash
# Crear nuevo repositorio
git clone <video-server-repo>
cd SERVER-VIDEO-PI

# Estructura similar al servidor de voz
mkdir -p src/{config,controllers,services,routes,middlewares,models,utils}
```

### 2. Compartir Configuración de Firebase

Ambos servidores deben usar las **mismas credenciales de Firebase**:

```typescript
// En .env de ambos servidores
FIREBASE_PROJECT_ID = same - project - id;
FIREBASE_PRIVATE_KEY = same - private - key;
FIREBASE_CLIENT_EMAIL = same - client - email;
```

### 3. Modelo de Datos para Video

```typescript
// src/models/types.ts (en servidor de video)

export interface VideoStream {
  meetingId: string;
  userId: string;
  streamId: string;
  isActive: boolean;
  resolution: '360p' | '480p' | '720p' | '1080p';
  frameRate: 24 | 30 | 60;
  bitrate: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface Participant {
  userId: string;
  email: string;
  name: string;
  audioStreamId: string; // Referencia al servidor de voz
  videoStreamId: string; // Referencia al servidor de video
  isAudioMuted: boolean;
  isVideoOn: boolean;
  joinedAt: Date;
}
```

### 4. Sincronización de Reuniones

En el servidor de video, sincronizar con el servidor de voz:

```typescript
// src/services/meetingSyncService.ts

import axios from 'axios';

class MeetingSyncService {
  private voiceServerUrl =
    process.env.VOICE_SERVER_URL || 'http://localhost:3001';

  /**
   * Obtener información de reunión del servidor de voz
   */
  async getMeetingFromVoiceServer(meetingId: string, token: string) {
    try {
      const response = await axios.get(
        `${this.voiceServerUrl}/api/meetings/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.meeting;
    } catch (error) {
      console.error('Error sincronizando reunión:', error);
      throw error;
    }
  }

  /**
   * Obtener participantes del servidor de voz
   */
  async getParticipantsFromVoiceServer(meetingId: string, token: string) {
    try {
      const response = await axios.get(
        `${this.voiceServerUrl}/api/meetings/${meetingId}/participants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.participants;
    } catch (error) {
      console.error('Error obteniendo participantes:', error);
      throw error;
    }
  }
}

export default new MeetingSyncService();
```

### 5. WebSocket Events para Video

Agregar eventos similares a los del servidor de voz:

```typescript
// En socketHandler.ts del servidor de video

socket.on(
  'join-video-meeting',
  (data: { userId: string; meetingId: string }) => {
    // Unierse a sala de video
    socket.join(`video-meeting-${data.meetingId}`);

    // Notificar a otros usuarios
    socket.to(`video-meeting-${data.meetingId}`).emit('video-user-joined', {
      userId: data.userId,
      socketId: socket.id,
    });
  }
);

socket.on('webrtc-video-offer', (data: WebRTCOffer) => {
  // Reenviar oferta de video
  // Similar al audio pero para video
});

socket.on('webrtc-video-answer', (data: WebRTCAnswer) => {
  // Reenviar respuesta de video
});
```

### 6. Cliente Integrado (Voz + Video)

```typescript
// En tu cliente

import VoiceClient from './VoiceClient';
import VideoClient from './VideoClient';

class MeetClient {
  private voiceClient: VoiceClient;
  private videoClient: VideoClient;
  private currentMeetingId: string | null = null;

  constructor() {
    this.voiceClient = new VoiceClient('http://localhost:3001');
    this.videoClient = new VideoClient('http://localhost:3002');
  }

  async joinMeeting(
    meetingId: string,
    options: {
      audio: boolean;
      video: boolean;
      videoResolution?: '360p' | '480p' | '720p' | '1080p';
    }
  ): Promise<void> {
    this.currentMeetingId = meetingId;

    // Conectar voz si se solicita
    if (options.audio) {
      await this.voiceClient.joinMeeting(meetingId);
    }

    // Conectar video si se solicita
    if (options.video) {
      await this.videoClient.joinMeeting(meetingId, {
        resolution: options.videoResolution || '720p',
      });
    }

    console.log('✅ Conectado a reunión con audio y video');
  }

  leaveMeeting(): void {
    this.voiceClient.leaveMeeting();
    this.videoClient.leaveMeeting();
    this.currentMeetingId = null;
  }

  toggleAudio(enabled: boolean): void {
    this.voiceClient.toggleAudio(enabled);
  }

  toggleVideo(enabled: boolean): void {
    this.videoClient.toggleVideo(enabled);
  }
}

export default MeetClient;
```

### 7. Rutas REST del Servidor de Video

```typescript
// src/routes/video.ts

router.post('/:meetingId/streams', createVideoStream);
router.get('/:meetingId/streams', getVideoStreams);
router.put('/:streamId/resolution', updateResolution);
router.put('/:streamId/frameRate', updateFrameRate);
router.post('/:streamId/stop', stopVideoStream);
```

### 8. Actualizar Variables de Entorno

En el servidor de voz (`.env`):

```env
VIDEO_SERVER_URL=http://localhost:3002
VIDEO_SERVER_ENABLED=true
```

En el servidor de video (`.env`):

```env
VOICE_SERVER_URL=http://localhost:3001
VOICE_SERVER_ENABLED=true
```

## 🔄 Flujo de Integración

### Unirse a Reunión con Audio y Video

```
1. Cliente conecta a SERVIDOR VOZ
   ├─ Autenticación Firebase
   ├─ Socket.io conexión
   └─ join-meeting event

2. Servidor VOZ crea AudioStream
   └─ Retorna audioStreamId

3. Cliente conecta a SERVIDOR VIDEO
   ├─ Misma autenticación Firebase
   ├─ Socket.io conexión
   └─ join-video-meeting event

4. Servidor VIDEO crea VideoStream
   ├─ Sincroniza con SERVIDOR VOZ
   └─ Retorna videoStreamId

5. Participantes establecen conexiones P2P
   ├─ Audio WebRTC (a través de SERVIDOR VOZ)
   └─ Video WebRTC (a través de SERVIDOR VIDEO)

6. Transmisión activa de Audio + Video
```

## 📊 Monitoreo Integrado

Crear endpoint de estadísticas que combine datos de ambos servidores:

```typescript
// GET /api/stats (en un gateway/admin server)

{
  "meeting": {
    "id": "meeting-123",
    "participants": 5,
    "audio": {
      "activeStreams": 5,
      "serverUrl": "http://localhost:3001"
    },
    "video": {
      "activeStreams": 3,
      "serverUrl": "http://localhost:3002",
      "resolutions": {
        "720p": 2,
        "1080p": 1
      }
    }
  }
}
```

## 🔐 Seguridad

- Ambos servidores usan Firebase Admin SDK
- Tokens JWT validados en ambos lados
- Socket.io con autenticación
- CORS configurado correctamente
- HTTPS en producción

## 🧪 Pruebas de Integración

```bash
# Terminal 1: Servidor de voz
cd SERVER-VOICE-PI
npm run dev

# Terminal 2: Servidor de video
cd SERVER-VIDEO-PI
npm run dev

# Terminal 3: Cliente de pruebas
npm run test:integration
```

## 📝 Ejemplo de Respuesta GET Meeting Integrado

```json
{
  "meeting": {
    "id": "meeting-uuid",
    "name": "Reunión de Prueba",
    "creatorId": "user-uid",
    "participants": [
      {
        "userId": "user-1",
        "name": "Juan",
        "email": "juan@example.com",
        "audioStreamId": "audio-stream-1",
        "videoStreamId": "video-stream-1",
        "audioActive": true,
        "videoActive": true,
        "videoResolution": "720p"
      }
    ],
    "audio": {
      "activeStreams": 3,
      "totalBitrate": "192kbps"
    },
    "video": {
      "activeStreams": 2,
      "totalBitrate": "5000kbps"
    },
    "startedAt": "2024-11-27T10:30:00Z"
  }
}
```

## 🚨 Errores Comunes en Integración

### Error: "Cannot connect to video server"

```
Solución: Asegúrate que VIDEO_SERVER_URL está correcto en .env
```

### Error: "Firebase credentials mismatch"

```
Solución: Ambos servidores deben usar MISMO projectId y keys
```

### Error: "User not in voice meeting"

```
Solución: Usuario debe primero unirse al servidor de voz
```

## 🎯 Próximos Pasos

1. Crear servidor de video en repositorio separado
2. Implementar sincronización de reuniones
3. Agregar endpoints para gestión de resolución/frameRate
4. Crear cliente integrado (voz + video)
5. Implementar monitoreo y estadísticas
6. Pruebas de carga y estrés
7. Documentación de API completa

## 📞 Soporte

Para preguntas sobre integración, consulta:

- Documentación de Firebase: https://firebase.google.com/docs
- Socket.io: https://socket.io/docs/
- WebRTC: https://webrtc.org/getting-started/overview
