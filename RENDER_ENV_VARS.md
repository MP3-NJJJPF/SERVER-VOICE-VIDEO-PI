# 🔐 Variables de Entorno para Render

Copia y pega estas variables en el dashboard de Render cuando crees el Web Service.

## 📋 Variables Requeridas

### Configuración Básica

```bash
NODE_ENV=production
PORT=10000
```

### CORS - Frontend en Vercel

```bash
SOCKET_CORS=http://localhost:5173,https://mp-3-frontend.vercel.app
```

⚠️ **IMPORTANTE**: Si tu app de Vercel tiene múltiples dominios (ej: con/sin www, preview URLs), agrégalos separados por comas:

```bash
SOCKET_CORS=https://mp-3-frontend.vercel.app,https://www.mp-3-frontend.vercel.app,https://mp-3-frontend-preview.vercel.app
```

### STUN Servers (WebRTC)

```bash
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302,stun:stun3.l.google.com:19302
```

## 🔥 Firebase Credentials

⚠️ **RECOMENDADO**: Usa `GOOGLE_APPLICATION_CREDENTIALS` con el JSON completo.

### GOOGLE_APPLICATION_CREDENTIALS (RECOMENDADO)

Esta es la forma más sencilla y segura. Copia y pega el JSON completo:

"secret wsp last commt"

**Cómo agregar en Render:**

1. Ve a Environment en tu servicio de Render
2. Click en "Add Environment Variable"
3. Key: `GOOGLE_APPLICATION_CREDENTIALS`
4. Value: Pega el JSON completo (Render lo maneja automáticamente)
5. Click "Save"

✅ **Ventajas**:

- Más fácil de configurar
- No hay problemas con saltos de línea
- Es el formato estándar de Google Cloud

### Alternativa: Credenciales Individuales

Si prefieres usar variables separadas (no recomendado):

**FIREBASE_PROJECT_ID**

```
miniproy-pi-3
```

**FIREBASE_CLIENT_EMAIL**

```
firebase-adminsdk-fbsvc@miniproy-pi-3.iam.gserviceaccount.com
```

**FIREBASE_PRIVATE_KEY**

⚠️ Esta opción puede dar problemas con los saltos de línea. Usa `GOOGLE_APPLICATION_CREDENTIALS` en su lugar.

## 📝 Cómo Agregar Variables en Render

### Paso a Paso:

1. Ve a tu servicio en Render Dashboard
2. Click en **"Environment"** en el menú lateral
3. Para cada variable:
   - Click en **"Add Environment Variable"**
   - Ingresa el **Key** (nombre de la variable)
   - Ingresa el **Value** (valor)
   - Click en **"Save Changes"**

### Para FIREBASE_PRIVATE_KEY específicamente:

1. Click en **"Add Environment Variable"**
2. Key: `FIREBASE_PRIVATE_KEY`
3. Value: Click en el icono de **expand** (↗️) para abrir el editor grande
4. Pega la clave completa (Opción 1 de arriba)
5. Render manejará automáticamente el formato

## ✅ Checklist de Variables

Marca cada variable mientras la agregas en Render:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `SOCKET_CORS` = `http://localhost:5173,https://mp-3-frontend.vercel.app`
- [ ] `STUN_SERVERS` = (los 4 servidores STUN)
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` = (JSON completo de Firebase)

## 🔒 Seguridad

⚠️ **NUNCA** subas este archivo al repositorio. Ya está en `.gitignore`.

Las credenciales solo deben estar:

- ✅ En tu `.env` local (no versionado)
- ✅ En Render Dashboard (encriptadas)
- ❌ NUNCA en Git/GitHub

## 🧪 Verificar que Funciona

Después de configurar las variables y desplegar:

```bash
# 1. Health check
curl https://tu-servidor.onrender.com/health

# 2. Verificar Firebase (si está autenticado)
curl -H "Authorization: Bearer TU_TOKEN" https://tu-servidor.onrender.com/api/meetings

# 3. Verificar ICE servers
curl https://tu-servidor.onrender.com/api/ice-servers
```

Si Firebase está configurado correctamente, verás en los logs:

```
✅ Firebase inicializado correctamente
```

Si hay algún problema, verás:

```
⚠️ Firebase no está configurado
```

## 📚 Referencias

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Notas del Equipo:**

- Project ID: `miniproy-pi-3`
- Frontend: `https://mp-3-frontend.vercel.app`
- Puerto local: `5173` (Vite)
- Puerto producción: `10000` (Render)
