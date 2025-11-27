# 💻 COMANDOS ÚTILES - Servidor de Voz

Referencia rápida de comandos para trabajar con el servidor de voz.

## 🚀 INICIAR

```bash
# Instalar dependencias
npm install

# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start

# Verificar instalación
npm run verify
```

## 🧪 PRUEBAS

```bash
# Verificar salud del servidor
curl http://localhost:3001/health

# Obtener info del servidor
curl http://localhost:3001/api/server-info

# Obtener estadísticas
curl http://localhost:3001/api/stats

# Script de pruebas completo
bash test_server.sh
```

## 📝 CONFIGURACIÓN

```bash
# Copiar plantilla de variables
cp .env.example .env

# Editar variables (necesitas token/key de Firebase)
nano .env
# o
code .env

# Verificar variables (.env debe tener):
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
```

## 🏗️ COMPILACIÓN

```bash
# Compilar TypeScript
npm run build

# Compilar y ver tipos
tsc --noEmit

# Verificar con ESLint
npm run lint

# Limpiar build anterior
rm -rf dist/
```

## 🐳 DOCKER

```bash
# Construir imagen Docker
docker build -t voice-server:latest .

# Ejecutar con Docker
docker run -p 3001:3001 -e FIREBASE_PROJECT_ID=xxx voice-server:latest

# Ejecutar con docker-compose
docker-compose up

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f voice-server
```

## 📡 ENDPOINTS HTTP (CON CURL)

### Crear Reunión

```bash
curl -X POST http://localhost:3001/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mi Reunión",
    "maxParticipants": 50
  }'
```

### Obtener Reuniones Activas

```bash
curl http://localhost:3001/api/meetings/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Obtener Detalles de Reunión

```bash
curl http://localhost:3001/api/meetings/MEETING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Obtener Participantes

```bash
curl http://localhost:3001/api/meetings/MEETING_ID/participants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Unirse a Reunión

```bash
curl -X POST http://localhost:3001/api/meetings/MEETING_ID/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Salir de Reunión

```bash
curl -X POST http://localhost:3001/api/meetings/MEETING_ID/leave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Finalizar Reunión

```bash
curl -X POST http://localhost:3001/api/meetings/MEETING_ID/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Obtener Streams de Audio

```bash
curl http://localhost:3001/api/audio/meetings/MEETING_ID/streams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cambiar Calidad de Audio

```bash
curl -X PUT http://localhost:3001/api/audio/streams/STREAM_ID/quality \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"quality": "high"}'
```

## 🔧 DESARROLLO

### Editar archivo y guardar (hot reload automático)

```bash
npm run dev
# Los cambios se detectan automáticamente
```

### Ver logs en tiempo real

```bash
npm run dev
# Los logs aparecen con colores y emojis
```

### Debugging

```bash
# Con NODE_DEBUG
NODE_DEBUG=http npm run dev

# Con Socket.io debug
DEBUG=socket.io* npm run dev
```

## 📦 GESTIÓN DE DEPENDENCIAS

```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Instalar como dev dependency
npm install --save-dev nombre-paquete

# Ver dependencias instaladas
npm list

# Ver vulnerabilidades
npm audit

# Actualizar dependencias
npm update
```

## 🧹 MANTENIMIENTO

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar compilados
rm -rf dist/

# Ejecutar linter
npm run lint

# Verificar instalación
npm run verify
```

## 📊 MONITOREO

```bash
# Ver puerto 3001 en uso
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# Matar proceso en puerto
# Windows
taskkill /PID 1234 /F

# Linux/Mac
kill -9 1234
```

## 🚨 TROUBLESHOOTING

### Puerto en uso

```bash
# Cambiar puerto en .env
PORT=3002

# O matar proceso
lsof -ti:3001 | xargs kill -9
```

### Node modules corrupto

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errores

```bash
# Verificar tipos
tsc --noEmit

# Compilar y ver errores
npm run build
```

### Firebase no conecta

```bash
# Verificar .env tiene todas las variables
cat .env

# Verificar formato de FIREBASE_PRIVATE_KEY
# Debe ser una string con \n, no multiline
```

## 📚 REFERENCIAS

- **Documentación**: Ver README.md
- **Setup Rápido**: Ver QUICKSTART.md
- **Video Integration**: Ver INTEGRATION_VIDEO.md
- **Cliente Ejemplo**: Ver CLIENT_EXAMPLE.ts
- **API Completa**: Ver README.md en sección "API Endpoints"

## 🎯 FLUJOS COMUNES

### Desarrollo Local Completo

```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Pruebas
bash test_server.sh

# Terminal 3: Cliente/Tests manuales
# Conectar con VoiceClient
```

### Deploy a Producción

```bash
# 1. Compilar
npm run build

# 2. Crear .env para producción
cp .env.example .env.production
# Editar con valores de producción

# 3. Con Docker
docker build -t voice-server:1.0.0 .
docker run -d -p 3001:3001 --env-file .env.production voice-server:1.0.0

# 4. Con Heroku
git push heroku main
heroku logs --tail
```

### Debugging Socket.io

```bash
# Ver eventos
DEBUG=socket.io*,socket.io-parser npm run dev

# Ver detalles de conexión
DEBUG=*:* npm run dev
```

## 💡 TIPS

1. **Hot Reload**: `npm run dev` recarga automáticamente
2. **Logging**: Usa console.log, Winston, o Pino para logs
3. **Tipos**: TypeScript previene errores
4. **Seguridad**: Siempre validar tokens JWT
5. **Testing**: Usa las pruebas en QUICKSTART.md
6. **Git**: Los .env nunca se suben al repo
7. **Performance**: Monitorear conexiones con `/api/stats`

## 🤝 INTEGRACIÓN CON OTROS SERVIDORES

```bash
# Servidor de Usuarios
# Endpoint para obtener user info

# Servidor de Chat
# Compartir meetingId y userId

# Servidor de Video (Futuro)
# Ver INTEGRATION_VIDEO.md
```

---

**¡Listo para usar! Cualquier duda, revisa la documentación completa.**
