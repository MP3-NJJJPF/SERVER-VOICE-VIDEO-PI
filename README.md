# Server Voice & Video PI

Servidor de transmisión de **audio y video** en tiempo real para aplicaciones tipo Meet/Zoom. Proporciona funcionalidades completas de WebRTC, Socket.io para comunicación en tiempo real, gestión de reuniones y streams de audio y video.

## Características

- **WebRTC P2P Audio & Video Streaming** - Transmisión de audio y video punto a punto con calidad adaptativa
- **Socket.io Real-time Communication** - Comunicación bidireccional en tiempo real
- **Meeting Management** - Crear y gestionar reuniones de audio y video
- **Firebase Authentication** - Autenticación segura con Firebase
- **Audio Quality Control** - Ajuste dinámico de calidad de audio (low, medium, high)
- **Video Quality Control** - Ajuste dinámico de calidad de video (low, medium, high, hd)
- **Video Resolution Support** - Resoluciones desde 320x240 hasta 1920x1080
- **STUN/TURN Server Support** - Soporte para servidores STUN y TURN
- **TypeScript** - Código tipado y seguro
- **Arquitectura escalable** - Servicios separados para audio y video

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**
   Copia `.env.example` a `.env` y completa con tus datos:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# STUN Servers
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Socket.io
SOCKET_CORS=http://localhost:3000

# Para integración de video (futuro)
VIDEO_SERVER_URL=http://localhost:3002
```

## Ejecución

### Desarrollo (con hot reload)

```bash
npm run dev
```

## API Endpoints

### Reuniones

#### Crear reunión

```http
POST /api/meetings
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "name": "Mi Primera Reunión",
  "maxParticipants": 50
}

Response: 201
{
  "success": true,
  "meeting": {
    "id": "meeting-uuid",
    "name": "Mi Primera Reunión",
    "creatorId": "user-uid",
    "participants": ["user-uid"],
    "isActive": true,
    "startedAt": "2024-11-27T10:30:00Z"
  }
}
```

#### Obtener reuniones activas

```http
GET /api/meetings/active
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "meetings": [...]
}
```

#### Obtener detalles de reunión

```http
GET /api/meetings/:meetingId
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "meeting": {...}
}
```

#### Unirse a reunión

```http
POST /api/meetings/:meetingId/join
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "meeting": {...},
  "audioStream": {
    "meetingId": "meeting-uuid",
    "userId": "user-uid",
    "streamId": "stream-uuid",
    "quality": "high"
  },
  "videoStream": {
    "meetingId": "meeting-uuid",
    "userId": "user-uid",
    "streamId": "video-stream-uuid",
    "quality": "high",
    "resolution": "1280x720"
  }
}
```

#### Salir de reunión

```http
POST /api/meetings/:meetingId/leave
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "message": "Salido de la reunión"
}
```

#### Finalizar reunión (solo creador)

```http
POST /api/meetings/:meetingId/end
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "message": "Reunión finalizada"
}
```

#### Obtener participantes

```http
GET /api/meetings/:meetingId/participants
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "participants": ["user-id-1", "user-id-2"]
}
```

### Audio Streams

#### Obtener streams activos de una reunión

```http
GET /api/audio/meetings/:meetingId/streams
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "streams": [...]
}
```

#### Cambiar calidad de audio

```http
PUT /api/audio/streams/:streamId/quality
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "quality": "high"
}

Response: 200
{
  "success": true,
  "message": "Calidad ajustada a high"
}
```

#### Detener stream

```http
POST /api/audio/streams/:streamId/stop
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "message": "Stream detenido"
}
```

### Video Streams

#### Obtener streams de video activos de una reunión

```http
GET /api/video/meetings/:meetingId/streams
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "streams": [
    {
      "meetingId": "meeting-uuid",
      "userId": "user-uid",
      "streamId": "video-stream-uuid",
      "quality": "high",
      "resolution": "1280x720",
      "isActive": true
    }
  ]
}
```

#### Cambiar calidad de video

```http
PUT /api/video/streams/:streamId/quality
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "quality": "hd"
}

Response: 200
{
  "success": true,
  "message": "Calidad de video ajustada a hd"
}
```

**Calidades disponibles:**

- `low` - 320x240 (conexiones lentas)
- `medium` - 640x480 (estándar SD)
- `high` - 1280x720 (HD)
- `hd` - 1920x1080 (Full HD)

#### Detener stream de video

```http
POST /api/video/streams/:streamId/stop
Authorization: Bearer <firebase-token>

Response: 200
{
  "success": true,
  "message": "Video stream detenido"
}
```

## Pruebas

### Prueba de salud del servidor

```bash
curl http://localhost:3001/health
```

### Prueba de información del servidor

```bash
curl http://localhost:3001/api/server-info
```
