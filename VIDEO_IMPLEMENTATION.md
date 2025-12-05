# Funcionalidad de Video - SERVER-VOICE-VIDEO-PI

## Resumen de Cambios

Se ha implementado soporte completo para **transmisión de video** sin afectar las funcionalidades existentes de audio. El sistema ahora soporta reuniones con audio y video simultáneamente.

---

## Nuevos Archivos Creados

### 1. **`src/services/videoService.ts`**

Servicio para gestionar streams de video con las siguientes funcionalidades:

- Crear streams de video con calidad configurable
- Detener streams de video
- Cambiar calidad en tiempo real
- Limpieza automática de streams inactivos

### 2. **`src/controllers/videoController.ts`**

Controlador con endpoints para:

- Obtener streams de video de una reunión
- Obtener detalles de un stream específico
- Detener un stream
- Cambiar calidad del video

### 3. **`src/routes/video.ts`**

Rutas REST API para gestión de video:

- `GET /api/video/meetings/:meetingId/streams` - Lista streams de una reunión
- `GET /api/video/streams/:streamId` - Detalles de un stream
- `POST /api/video/streams/:streamId/stop` - Detener stream
- `PUT /api/video/streams/:streamId/quality` - Cambiar calidad

---

## Archivos Modificados

### 1. **`src/models/types.ts`**

✅ Agregado nuevo tipo `VideoStream`:

```typescript
export interface VideoStream {
  meetingId: string;
  userId: string;
  streamId: string;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high' | 'hd';
  resolution?: string; // '640x480', '1280x720', '1920x1080'
  startedAt: Date;
  endedAt?: Date;
}
```

### 2. **`src/index.ts`**

✅ Importado y registrado ruta de video
✅ Actualizado nombre del servidor: "Voice & Video Server"
✅ Actualizada descripción con feature 'video-streaming'

### 3. **`src/utils/socketHandler.ts`**

✅ Agregado evento `toggle-video` para activar/desactivar cámara:

```typescript
socket.on('toggle-video', (data) => {
  socket.to(`meeting-${data.meetingId}`).emit('video-state-changed', {
    userId: data.userId,
    isVideoOff: data.isVideoOff,
  });
});
```

### 4. **`src/controllers/meetingController.ts`**

✅ Ahora crea tanto audio como video streams al unirse a una reunión
✅ Respuesta incluye ambos streams: `{ audioStream, videoStream }`

---

## Calidades de Video Disponibles

| Calidad  | Resolución | Uso Recomendado                   |
| -------- | ---------- | --------------------------------- |
| `low`    | 320x240    | Conexiones lentas                 |
| `medium` | 640x480    | Estándar (SD)                     |
| `high`   | 1280x720   | Alta definición (HD)              |
| `hd`     | 1920x1080  | Full HD (requiere buena conexión) |

---

## Uso desde el Cliente

### 1. **Unirse a una Reunión**

```javascript
// POST /api/meetings/:meetingId/join
const response = await fetch('/api/meetings/abc123/join', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
  },
});

const { meeting, audioStream, videoStream } = await response.json();
console.log('Audio Stream ID:', audioStream.streamId);
console.log('Video Stream ID:', videoStream.streamId);
```

### 2. **Toggle Video con Socket.io**

```javascript
// Activar/desactivar cámara
socket.emit('toggle-video', {
  userId: 'user123',
  meetingId: 'meeting456',
  isVideoOff: false, // false = cámara ON, true = cámara OFF
});

// Escuchar cambios de video de otros usuarios
socket.on('video-state-changed', (data) => {
  console.log(
    `Usuario ${data.userId} ${
      data.isVideoOff ? 'desactivó' : 'activó'
    } su cámara`
  );
  // Actualizar UI según el estado
});
```

### 3. **Cambiar Calidad de Video**

```javascript
// PUT /api/video/streams/:streamId/quality
await fetch(`/api/video/streams/${streamId}/quality`, {
  method: 'PUT',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ quality: 'hd' }),
});
```

### 4. **Obtener Streams de Video de una Reunión**

```javascript
// GET /api/video/meetings/:meetingId/streams
const response = await fetch('/api/video/meetings/abc123/streams', {
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
  },
});

const { streams } = await response.json();
streams.forEach((stream) => {
  console.log(`Usuario: ${stream.userId}, Calidad: ${stream.quality}`);
});
```

### 5. **Detener Video Stream**

```javascript
// POST /api/video/streams/:streamId/stop
await fetch(`/api/video/streams/${streamId}/stop`, {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
  },
});
```

---

## WebRTC - Configuración de Tracks

El servidor maneja la **señalización**, pero el cliente debe configurar los tracks de audio/video:

```javascript
// Obtener stream del usuario con audio y video
const localStream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
});

// Crear conexión WebRTC
const peerConnection = new RTCPeerConnection(iceServers);

// Agregar tracks al peer connection
localStream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, localStream);
});

// El servidor relay las señales (offer/answer/ice-candidate)
// pero el video/audio fluye P2P entre clientes
```

---

## Eventos Socket.io Completos

| Evento                    | Dirección                    | Descripción                  |
| ------------------------- | ---------------------------- | ---------------------------- |
| `join-meeting`            | Cliente → Servidor           | Usuario se une a reunión     |
| `leave-meeting`           | Cliente → Servidor           | Usuario sale de reunión      |
| `toggle-audio`            | Cliente → Servidor           | Mutear/desmutear audio       |
| **`toggle-video`**        | **Cliente → Servidor**       | **Activar/desactivar video** |
| `webrtc-offer`            | Cliente → Servidor → Cliente | Oferta WebRTC                |
| `webrtc-answer`           | Cliente → Servidor → Cliente | Respuesta WebRTC             |
| `ice-candidate`           | Cliente → Servidor → Cliente | Candidatos ICE               |
| `user-joined`             | Servidor → Cliente           | Nuevo usuario en sala        |
| `user-left`               | Servidor → Cliente           | Usuario salió de sala        |
| `audio-state-changed`     | Servidor → Cliente           | Estado de audio cambió       |
| **`video-state-changed`** | **Servidor → Cliente**       | **Estado de video cambió**   |

---

## Compatibilidad

✅ **Sin Breaking Changes**: Todas las funcionalidades de audio existentes siguen funcionando exactamente igual.

✅ **Opcional**: El video es completamente opcional. Los clientes pueden usar solo audio si lo prefieren.

✅ **Escalable**: Usa el mismo patrón de arquitectura que el audio (Services, Controllers, Routes).

---

## Testing

### Test Manual con cURL:

```bash
# 1. Crear reunión
curl -X POST http://localhost:3001/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Meeting"}'

# 2. Unirse a reunión (crea audio y video streams)
curl -X POST http://localhost:3001/api/meetings/MEETING_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Ver video streams activos
curl http://localhost:3001/api/video/meetings/MEETING_ID/streams \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Cambiar calidad de video
curl -X PUT http://localhost:3001/api/video/streams/STREAM_ID/quality \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quality": "hd"}'

# 5. Detener video stream
curl -X POST http://localhost:3001/api/video/streams/STREAM_ID/stop \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Próximos Pasos Recomendados

1. **Implementar en el Cliente**: Configurar MediaStream con video en tu aplicación frontend
2. **Optimizar Bitrate**: Ajustar bitrate según la calidad seleccionada
3. **Screen Sharing**: Agregar soporte para compartir pantalla
4. **Recording**: Implementar grabación de reuniones
5. **Layout Controls**: Agregar controles para cambiar layout (grid, speaker, etc.)

---

## Soporte

Para dudas o problemas con la implementación de video, revisa:

- `src/services/videoService.ts` - Lógica de negocio
- `src/controllers/videoController.ts` - Endpoints HTTP
- `src/utils/socketHandler.ts` - Eventos en tiempo real
