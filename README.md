# Server Voice PI

Servidor de transmisión de voz en tiempo real para aplicaciones tipo Meet. Proporciona funcionalidades de WebRTC, Socket.io para comunicación en tiempo real, gestión de reuniones y streams de audio.

## Características

-  **WebRTC P2P Audio Streaming** - Transmisión de audio punto a punto con calidad adaptativa
-  **Socket.io Real-time Communication** - Comunicación bidireccional en tiempo real
-  **Meeting Management** - Crear y gestionar reuniones de audio
-  **Firebase Authentication** - Autenticación segura con Firebase
-  **Audio Quality Control** - Ajuste dinámico de calidad (low, medium, high)
-  **STUN Server Support** - Soporte para servidores STUN
-  **TypeScript** - Código tipado y seguro
-  **Listo para integración de video** - Extensible para agregar funcionalidad de video

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

##  Ejecución

### Desarrollo (con hot reload)

```bash
npm run dev
```

##  API Endpoints

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


##  Pruebas

### Prueba de salud del servidor

```bash
curl http://localhost:3001/health
```

### Prueba de información del servidor

```bash
curl http://localhost:3001/api/server-info
```
