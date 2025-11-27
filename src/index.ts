import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import SocketIOHandler from './utils/socketHandler';
import meetingRoutes from './routes/meetings';
import audioRoutes from './routes/audio';

// Cargar variables de entorno
dotenv.config();

// Configurar orígenes permitidos para CORS
const allowedOrigins = process.env.SOCKET_CORS
  ? process.env.SOCKET_CORS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Inicializar manejador de Socket.io
new SocketIOHandler(io);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Variables globales
app.locals.io = io;

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de la API
app.use('/api/meetings', meetingRoutes);
app.use('/api/audio', audioRoutes);

// Ruta para obtener información del servidor
app.get('/api/server-info', (req, res) => {
  res.json({
    name: 'Voice Server',
    version: '1.0.0',
    description: 'Servidor de transmisión de voz en tiempo real',
    webrtcSupported: true,
    features: ['webrtc', 'socket.io', 'audio-streaming', 'meeting-management'],
    environment: process.env.NODE_ENV,
  });
});

// Ruta para obtener configuración de ICE servers (STUN/TURN)
app.get('/api/ice-servers', (req, res) => {
  const stunServers = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(',').map(url => url.trim())
    : ['stun:stun.l.google.com:19302'];

  const iceServers = stunServers.map(url => ({ urls: url }));

  res.json({
    iceServers,
    timestamp: new Date().toISOString(),
  });
});

// Ruta para estadísticas del servidor
app.get('/api/stats', (req, res) => {
  res.json({
    connectedUsers: io.engine.clientsCount,
    connectedSockets: io.sockets.sockets.size,
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  });
});

// Manejo global de errores
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error no manejado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║          VOICE SERVER INICIADO         ║
╚════════════════════════════════════════╝
|
📍 Servidor ejecutándose en puerto: ${PORT}
🌐 CORS habilitado para: ${process.env.SOCKET_CORS || 'http://localhost:3000'}
⚙️  Entorno: ${process.env.NODE_ENV || 'development'}

📚 Endpoints disponibles:
  • GET  /health              - Estado del servidor
  • GET  /api/server-info     - Información del servidor
  • GET  /api/stats           - Estadísticas en tiempo real
  • POST /api/meetings        - Crear reunión
  • GET  /api/meetings/active - Obtener reuniones activas

🔗 WebSocket disponible en el puerto ${PORT}

`);
});

export { app, httpServer, io };
