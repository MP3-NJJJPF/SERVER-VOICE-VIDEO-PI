import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import SocketIOHandler from './utils/socketHandler';
import meetingRoutes from './routes/meetings';
import audioRoutes from './routes/audio';
import videoRoutes from './routes/video';

// Cargar variables de entorno
dotenv.config();

// Configurar orígenes permitidos para CORS
const allowedOrigins = process.env.SOCKET_CORS
  ? process.env.SOCKET_CORS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

console.log('CORS habilitado para:', allowedOrigins);

// Inicializar manejador de Socket.io
new SocketIOHandler(io);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Request from origin:', origin);
      
      // Permitir peticiones sin origin (como Postman, apps móviles)
      if (!origin) {
        console.log('Allowing request without origin');
        return callback(null, true);
      }
      
      // Normalizar el origin quitando el slash final si existe
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      
      // Normalizar los origins permitidos también
      const normalizedAllowedOrigins = allowedOrigins.map(o => 
        o.endsWith('/') ? o.slice(0, -1) : o
      );
      
      if (normalizedAllowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
        console.log('Origin allowed:', origin);
        callback(null, true);
      } else {
        console.warn('Origin not allowed:', origin);
        // En desarrollo, permitir de todos modos para debugging
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
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
app.use('/api/video', videoRoutes);
// Ruta para obtener información del servidor
app.get('/api/server-info', (req, res) => {
  res.json({
    name: 'Voice & Video Server',
    version: '1.0.0',
    description: 'Servidor de transmisión de voz y video en tiempo real',
    webrtcSupported: true,
    features: ['webrtc', 'socket.io', 'audio-streaming', 'video-streaming', 'meeting-management'],
    features: ['webrtc', 'socket.io', 'audio-streaming', 'meeting-management'],
    environment: process.env.NODE_ENV,
  });
});

// Ruta para obtener configuración de ICE servers (STUN/TURN)
app.get('/api/ice-servers', (req, res) => {
  try {
    const iceServers: any[] = [];

    // Agregar servidores STUN
    const stunServers = process.env.STUN_SERVERS
      ? process.env.STUN_SERVERS.split(',').map(url => url.trim())
      : ['stun:stun.l.google.com:19302'];

    stunServers.forEach(url => {
      iceServers.push({ urls: url });
    });

    console.log('STUN servers configured:', stunServers.length);

    // Agregar servidores TURN si están configurados
    if (process.env.TURN_SERVER && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
      const turnConfig = {
        urls: process.env.TURN_SERVER,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD,
      };
      iceServers.push(turnConfig);
      console.log('TURN server configured:', process.env.TURN_SERVER);
    } else {
      console.warn('TURN server credentials not found in environment variables');
      console.warn('   TURN_SERVER:', process.env.TURN_SERVER ? 'SET' : 'NOT SET');
      console.warn('   TURN_USERNAME:', process.env.TURN_USERNAME ? 'SET' : 'NOT SET');
      console.warn('   TURN_PASSWORD:', process.env.TURN_PASSWORD ? 'SET' : 'NOT SET');
    }

    console.log('Returning', iceServers.length, 'ICE servers');

    res.json({
      iceServers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting ICE servers:', error);
    res.status(500).json({
      error: 'Failed to get ICE servers',
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      timestamp: new Date().toISOString(),
    });
  }
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
  console.error('Error no manejado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`

         VOICE SERVER INICIADO        

 Servidor ejecutándose en puerto: ${PORT}
 CORS habilitado para: ${process.env.SOCKET_CORS || 'http://localhost:3000'}
 Entorno: ${process.env.NODE_ENV || 'development'}

Endpoints disponibles:
  GET  /health              - Estado del servidor
  GET  /api/server-info     - Información del servidor
  GET  /api/stats           - Estadísticas en tiempo real
  POST /api/meetings        - Crear reunión
  GET  /api/meetings/active - Obtener reuniones activas

WebSocket disponible en el puerto ${PORT}

`);
});

export { app, httpServer, io };
