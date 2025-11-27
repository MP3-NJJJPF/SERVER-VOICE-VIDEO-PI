# 🎙️ Server Voice PI

Servidor de transmisión de voz en tiempo real para aplicaciones tipo Meet. Proporciona funcionalidades de WebRTC, Socket.io para comunicación en tiempo real, gestión de reuniones y streams de audio.

## 📋 Características

- ✅ **WebRTC P2P Audio Streaming** - Transmisión de audio punto a punto con calidad adaptativa
- ✅ **Socket.io Real-time Communication** - Comunicación bidireccional en tiempo real
- ✅ **Meeting Management** - Crear y gestionar reuniones de audio
- ✅ **Firebase Authentication** - Autenticación segura con Firebase
- ✅ **Audio Quality Control** - Ajuste dinámico de calidad (low, medium, high)
- ✅ **STUN Server Support** - Soporte para servidores STUN
- ✅ **TypeScript** - Código tipado y seguro
- ✅ **Listo para integración de video** - Extensible para agregar funcionalidad de video

## 🚀 Instalación

### Requisitos previos
- Node.js 16+ 
- npm o yarn
- Credenciales de Firebase (archivo de configuración JSON)

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd SERVER-VOICE-PI
```

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

## 🏃 Ejecución

### Desarrollo (con hot reload)
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📚 API Endpoints

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

## 🔌 WebSocket Events

### Cliente → Servidor

```javascript
// Unirse a reunión
socket.emit('join-meeting', {
  userId: 'user-uid',
  meetingId: 'meeting-uuid'
});

// Salir de reunión
socket.emit('leave-meeting', {
  userId: 'user-uid',
  meetingId: 'meeting-uuid'
});

// Enviar WebRTC Offer
socket.emit('webrtc-offer', {
  from: 'user-id-1',
  to: 'user-id-2',
  offer: rtcSessionDescription,
  meetingId: 'meeting-uuid'
});

// Enviar WebRTC Answer
socket.emit('webrtc-answer', {
  from: 'user-id-2',
  to: 'user-id-1',
  answer: rtcSessionDescription,
  meetingId: 'meeting-uuid'
});

// Enviar ICE Candidate
socket.emit('ice-candidate', {
  from: 'user-id-1',
  to: 'user-id-2',
  candidate: iceCandidate,
  meetingId: 'meeting-uuid'
});

// Ping para medir latencia
socket.emit('ping', (response) => {
  console.log('Pong:', response);
});
```

### Servidor → Cliente

```javascript
// Usuario se unió
socket.on('user-joined', {
  userId: 'user-uid',
  socketId: 'socket-id',
  message: 'Usuario se unió'
});

// Usuario se fue
socket.on('user-left', {
  userId: 'user-uid',
  message: 'Usuario salió'
});

// WebRTC Offer recibido
socket.on('webrtc-offer', {
  from: 'user-uid',
  offer: rtcSessionDescription,
  meetingId: 'meeting-uuid'
});

// WebRTC Answer recibido
socket.on('webrtc-answer', {
  from: 'user-uid',
  answer: rtcSessionDescription,
  meetingId: 'meeting-uuid'
});

// ICE Candidate recibido
socket.on('ice-candidate', {
  from: 'user-uid',
  candidate: iceCandidate,
  meetingId: 'meeting-uuid'
});

// Lista de usuarios en reunión
socket.on('meeting-users', {
  users: ['socket-id-1', 'socket-id-2']
});

// Usuario desconectado
socket.on('user-disconnected', {
  userId: 'user-uid',
  message: 'Usuario se desconectó'
});
```

## 🏗️ Estructura del Proyecto

```
src/
├── config/
│   └── firebase.ts           # Configuración de Firebase
├── controllers/
│   ├── meetingController.ts  # Lógica de reuniones
│   └── audioController.ts    # Lógica de audio
├── middlewares/
│   └── auth.ts              # Autenticación con Firebase
├── models/
│   └── types.ts             # Tipos TypeScript
├── routes/
│   ├── meetings.ts          # Rutas de reuniones
│   └── audio.ts             # Rutas de audio
├── services/
│   ├── meetingService.ts    # Servicio de reuniones
│   └── audioService.ts      # Servicio de audio
├── utils/
│   └── socketHandler.ts     # Manejador de Socket.io
└── index.ts                 # Archivo principal
```

## 🔐 Autenticación

El servidor utiliza **Firebase Authentication**. Todos los endpoints HTTP requieren un token JWT válido:

```
Authorization: Bearer <firebase-id-token>
```

Para obtener el token en tu cliente:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, currentUser } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await user.getIdToken();
```

## 📊 Estadísticas del Servidor

```http
GET /api/stats

Response: 200
{
  "connectedUsers": 5,
  "connectedSockets": 10,
  "timestamp": "2024-11-27T10:30:00Z"
}
```

## 🎬 Próximas Integraciones

### Servidor de Video (Para Sprint 3)
El servidor está preparado para integración con un servidor de video. Los puntos de extensión son:

1. **Nueva ruta**: `POST /api/video/streams` - Crear streams de video
2. **Evento WebSocket**: `webrtc-video-offer` / `webrtc-video-answer`
3. **Variable de entorno**: `VIDEO_SERVER_URL` - URL del servidor de video
4. **Modelo**: `VideoStream` - Similar a `AudioStream`

### Ejemplo de integración futura:
```typescript
// En socketHandler.ts
socket.on('webrtc-video-offer', (data: WebRTCOffer) => {
  // Reenviar al servidor de video
  this.handleWebRTCVideoOffer(socket, data);
});
```

## ⚙️ Configuración de STUN Servers

Los STUN servers ayudan a establecer conexiones P2P a través de NAT. Por defecto se usan:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

Para agregar más, edita `.env`:
```env
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302
```

## 🧪 Pruebas

### Prueba de salud del servidor
```bash
curl http://localhost:3001/health
```

### Prueba de información del servidor
```bash
curl http://localhost:3001/api/server-info
```

## 📝 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Ambiente | `development` o `production` |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `my-project-id` |
| `FIREBASE_PRIVATE_KEY` | Clave privada de Firebase | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Email de servicio de Firebase | `firebase-adminsdk@project.iam.gserviceaccount.com` |
| `STUN_SERVERS` | Servidores STUN para WebRTC | `stun:stun.l.google.com:19302` |
| `SOCKET_CORS` | Origen CORS para Socket.io | `http://localhost:3000` |
| `VIDEO_SERVER_URL` | URL del servidor de video | `http://localhost:3002` |

## 🔗 Conexión con otros servidores

### Servidor de Usuarios
El servidor de voz se integra con el servidor de usuarios mediante:
- Firebase Authentication (mismo proyecto)
- REST API para obtener información de usuarios

### Servidor de Chat
No requiere integración directa, pero pueden compartir:
- La misma reunión (meetingId)
- Los mismos usuarios (Firebase UID)

### Servidor de Video (Futuro)
Se conectará mediante:
- WebRTC Signaling (Socket.io)
- REST API para crear streams de video
- Mismo evento de Socket.io para coordinación

## 🚨 Logging y Debugging

El servidor incluye logging en consola:
- ✅ (Verde) - Acciones exitosas
- ❌ (Rojo) - Errores
- 👤 (Persona) - Eventos de usuarios
- 🎙️ (Micrófono) - Eventos de audio
- 🧹 (Escoba) - Limpieza de recursos

## 📄 Licencia

ISC

## 👨‍💻 Autor

Proyecto de servidor de voz para aplicación Meet

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Notas Importantes

- Asegúrate de tener un proyecto Firebase configurado
- La autenticación es obligatoria para todos los endpoints (excepto /health)
- Los STUN servers son necesarios para conexiones P2P
- Para producción, usa variables de entorno seguras
