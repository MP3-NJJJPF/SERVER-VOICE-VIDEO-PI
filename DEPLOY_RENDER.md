# 🚀 Deploy en Render - Servidor de Voz

Guía paso a paso para desplegar el servidor de voz en Render.

## 📋 Prerequisitos

1. Cuenta en [Render](https://render.com)
2. Repositorio en GitHub con el código
3. Credenciales de Firebase (opcional)

## 🔧 Configuración en Render

### Paso 1: Crear Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `SERVER-VOICE-PI`
4. Configura:
   - **Name**: `voice-server` (o el nombre que prefieras)
   - **Region**: Elige la más cercana a tus usuarios
   - **Branch**: `main` (o la rama que uses)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (o el que necesites)

### Paso 2: Variables de Entorno

En la sección **Environment Variables**, agrega:

```bash
# Básicas (requeridas)
NODE_ENV=production
PORT=10000

# CORS - Agrega tu dominio de Vercel
SOCKET_CORS=https://tu-app.vercel.app,https://www.tu-app.vercel.app

# STUN Servers (opcional - ya tiene valores por defecto)
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Firebase (opcional - solo si usas autenticación)
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\ntu-clave-aqui\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-project.iam.gserviceaccount.com
```

⚠️ **IMPORTANTE para FIREBASE_PRIVATE_KEY**: 
- Copia la clave completa incluyendo los saltos de línea como `\n`
- Debe estar entre comillas si lo configuras manualmente
- O usa el editor de Render que maneja esto automáticamente

### Paso 3: Health Check

Render automáticamente detectará el health check en `/health`

### Paso 4: Deploy

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar automáticamente
3. Espera a que el estado sea **"Live"** (verde)

## 🌐 URLs del Servidor

Una vez desplegado, tu servidor estará disponible en:

```
https://voice-server.onrender.com
```

(El nombre exacto dependerá del nombre que elegiste)

## ✅ Verificar el Deploy

### 1. Health Check
```bash
curl https://tu-servidor.onrender.com/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-11-27T...",
  "uptime": 123.45
}
```

### 2. ICE Servers (STUN)
```bash
curl https://tu-servidor.onrender.com/api/ice-servers
```

Respuesta esperada:
```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    { "urls": "stun:stun1.l.google.com:19302" }
  ],
  "timestamp": "2024-11-27T..."
}
```

### 3. Server Info
```bash
curl https://tu-servidor.onrender.com/api/server-info
```

## 🔗 Conectar desde Vercel (Frontend)

En tu aplicación de Vercel, configura las variables de entorno:

```bash
# .env.local o en Vercel Dashboard
NEXT_PUBLIC_VOICE_SERVER_URL=https://tu-servidor.onrender.com
```

En tu código de frontend:

```typescript
import { io } from 'socket.io-client';

// Conectar al servidor
const socket = io(process.env.NEXT_PUBLIC_VOICE_SERVER_URL || 'http://localhost:3001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

// Obtener ICE servers
const response = await fetch(`${process.env.NEXT_PUBLIC_VOICE_SERVER_URL}/api/ice-servers`);
const { iceServers } = await response.json();

// Usar en RTCPeerConnection
const pc = new RTCPeerConnection({ iceServers });
```

## 🔐 Seguridad

### CORS
El servidor ya está configurado para aceptar múltiples orígenes. Asegúrate de agregar tu dominio de Vercel en la variable `SOCKET_CORS`:

```bash
SOCKET_CORS=https://tu-app.vercel.app,https://preview-branch.vercel.app
```

### Firebase
Si usas Firebase, asegúrate de:
1. Configurar las reglas de Firestore
2. Agregar tu dominio de Vercel a los dominios autorizados en Firebase Console

## ⚡ Auto-Deploy

Render desplegará automáticamente cuando hagas push a tu rama principal (main).

## 📊 Monitoring

En el dashboard de Render puedes ver:
- Logs en tiempo real
- Métricas de uso (CPU, memoria)
- Historial de deploys
- Health checks

## 🐛 Troubleshooting

### El servidor no inicia
1. Verifica los logs en Render Dashboard
2. Asegúrate que `npm run build` funciona localmente
3. Verifica que todas las dependencias estén en `package.json`

### Error de CORS
1. Verifica que `SOCKET_CORS` incluya tu dominio de Vercel
2. Incluye tanto `https://app.vercel.app` como `https://www.app.vercel.app` si usas ambos

### Socket.io no conecta
1. Verifica que usas `transports: ['websocket', 'polling']`
2. Asegúrate de usar HTTPS en producción
3. Verifica que el puerto 10000 está abierto (Render lo maneja automáticamente)

### Firebase no funciona
1. Verifica que `FIREBASE_PRIVATE_KEY` tiene los saltos de línea correctos (`\n`)
2. Asegúrate que el service account tiene los permisos necesarios
3. Si no usas Firebase, el servidor funciona en modo mock

## 💰 Costos

**Plan Free de Render:**
- ✅ 750 horas gratis al mes
- ✅ Auto-sleep después de 15 minutos de inactividad
- ✅ Suficiente para desarrollo y pruebas
- ⚠️ Primer request puede tardar ~30 segundos (cold start)

**Para producción:**
- Considera el plan Starter ($7/mes) para eliminar el auto-sleep
- O el plan Professional para más recursos

## 🎯 Checklist de Deploy

- [ ] Repositorio en GitHub
- [ ] Variables de entorno configuradas en Render
- [ ] `SOCKET_CORS` incluye tu dominio de Vercel
- [ ] Build exitoso en Render
- [ ] Health check respondiendo
- [ ] Socket.io conectando desde frontend
- [ ] WebRTC funcionando (audio)
- [ ] Firebase configurado (si lo usas)

## 📚 Referencias

- [Render Docs](https://render.com/docs)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**¡Listo!** Tu servidor de voz estará disponible en Render y tu frontend en Vercel podrá conectarse sin problemas.
