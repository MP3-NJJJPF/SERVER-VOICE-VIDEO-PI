# ⚡ Quick Start - Servidor de Voz

Guía rápida para iniciar el servidor de voz en 5 minutos.

## 📦 Requisitos

- Node.js 16+
- npm o yarn
- Cuenta de Firebase

## 🚀 Instalación Rápida

### 1️⃣ Instalar dependencias

```bash
npm install
```

### 2️⃣ Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Genera una nueva clave de servicio:

   - Ir a Project Settings → Service Accounts
   - Click en "Generate New Private Key"
   - Se descargará un JSON

4. Copia los valores del JSON a tu `.env`:

```bash
# Copiar .env.example a .env
cp .env.example .env
```

5. Edita `.env` con tus valores:

```env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu-firebase-adminsdk@tu-project.iam.gserviceaccount.com
```

### 3️⃣ Ejecutar servidor

**Desarrollo (con auto-reload):**

```bash
npm run dev
```

**Producción:**

```bash
npm run build
npm start
```

## ✅ Verificar que funciona

```bash
# En otra terminal, prueba el endpoint de salud
curl http://localhost:3001/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2024-11-27T...","uptime":1.234}
```

## 🧪 Pruebas rápidas con cURL

### Crear reunión (necesitas token JWT válido)

```bash
# Primero obtén un token JWT de Firebase
# En tu cliente: const token = await user.getIdToken()

curl -X POST http://localhost:3001/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Mi Reunión", "maxParticipants": 50}'
```

### Obtener reuniones activas

```bash
curl http://localhost:3001/api/meetings/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ver estadísticas del servidor

```bash
curl http://localhost:3001/api/stats
```

## 📱 Conectar cliente

Usa el ejemplo en `CLIENT_EXAMPLE.ts`:

```typescript
import VoiceClient from './VoiceClient';

const client = new VoiceClient('http://localhost:3001');

// Conectar
await client.connect('email@example.com', 'password');

// Unirse a reunión
await client.joinMeeting('meeting-id');

// Salir
client.leaveMeeting();
```

## 🔧 Variables de entorno más comunes

| Variable      | Valor por defecto       | Descripción         |
| ------------- | ----------------------- | ------------------- |
| `PORT`        | `3001`                  | Puerto del servidor |
| `NODE_ENV`    | `development`           | Entorno             |
| `SOCKET_CORS` | `http://localhost:3000` | CORS para Socket.io |

## 🐛 Debugging

### Ver logs detallados

```bash
# Ya están habilitados por defecto
# Verás logs con colores y emojis
```

### Habilitar DEBUG de Socket.io

```bash
DEBUG=socket.io* npm run dev
```

## 📊 Estructura de carpetas

```
src/
├── index.ts                  ← Archivo principal
├── config/firebase.ts        ← Configuración Firebase
├── controllers/              ← Lógica de HTTP endpoints
├── services/                 ← Lógica de negocio
├── models/types.ts          ← Tipos TypeScript
├── routes/                   ← Rutas HTTP
├── middlewares/auth.ts      ← Autenticación
└── utils/socketHandler.ts   ← WebSocket/Socket.io
```

## 🆘 Problemas Comunes

### ❌ "FIREBASE_PRIVATE_KEY not found"

```
✅ Solución: Asegúrate de que .env existe y tiene FIREBASE_PRIVATE_KEY
```

### ❌ "EADDRINUSE: address already in use :::3001"

```
✅ Solución: Puerto 3001 en uso. Cambia PORT en .env o mata el proceso:
   Linux/Mac: lsof -ti:3001 | xargs kill -9
   Windows: netstat -ano | findstr :3001
```

### ❌ "Cannot find module 'express'"

```
✅ Solución: npm install
```

### ❌ "Socket.io CORS error"

```
✅ Solución: Actualiza SOCKET_CORS en .env con tu cliente URL
```

## 📚 Documentación completa

Ver `README.md` para:

- API endpoints detallados
- Eventos de Socket.io
- Ejemplos de cliente
- Integración con video
- Configuración avanzada

## 🎯 Próximos pasos

1. ✅ Servidor corriendo
2. ⏭️ Integrar con servidor de chat/usuarios existentes
3. ⏭️ Conectar cliente frontend
4. ⏭️ Agregar servidor de video
5. ⏭️ Deploy a producción

## 🚀 Deploy rápido en Heroku

```bash
# 1. Login a Heroku
heroku login

# 2. Crear app
heroku create mi-servidor-voz

# 3. Agregar variables de entorno
heroku config:set FIREBASE_PROJECT_ID=mi-proyecto
heroku config:set FIREBASE_PRIVATE_KEY="..."
heroku config:set FIREBASE_CLIENT_EMAIL="..."

# 4. Deploy
git push heroku main

# 5. Ver logs
heroku logs --tail
```

## 📞 Soporte

- Documentación: Ver README.md
- Problemas: Revisa los logs
- Firebase Help: https://firebase.google.com/support
