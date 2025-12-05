#!/bin/bash
# script_test.sh - Script de pruebas para el servidor de voz

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🎙️  PRUEBAS DEL SERVIDOR DE VOZ${NC}"
echo "=================================="

# Verificar que el servidor está corriendo
echo -e "\n${YELLOW}1. Verificando salud del servidor...${NC}"
curl -s http://localhost:3001/health | jq '.' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Servidor activo${NC}"
else
    echo -e "${RED}❌ Servidor no está corriendo${NC}"
    exit 1
fi

# Información del servidor
echo -e "\n${YELLOW}2. Información del servidor...${NC}"
curl -s http://localhost:3001/api/server-info | jq '.'

# Estadísticas del servidor
echo -e "\n${YELLOW}3. Estadísticas del servidor...${NC}"
curl -s http://localhost:3001/api/stats | jq '.'

# Prueba sin autenticación (debería fallar)
echo -e "\n${YELLOW}4. Prueba sin token (debería fallar)...${NC}"
curl -s -X GET http://localhost:3001/api/meetings/active | jq '.'

# Prueba de latencia (socket ping)
echo -e "\n${YELLOW}5. Prueba de latencia (Socket.io ping)...${NC}"
echo "Para probar ping, usa el cliente VoiceClient con:"
echo "socket.emit('ping', (response) => console.log(response))"

# Resumen
echo -e "\n${GREEN}=================================="
echo "✅ PRUEBAS COMPLETADAS"
echo "==================================${NC}"

echo -e "\n${YELLOW}Próximos pasos:${NC}"
echo "1. Obtener token JWT de Firebase"
echo "2. Probar crear reunión: POST /api/meetings"
echo "3. Conectar cliente: npm install socket.io-client firebase"
echo "4. Ver CLIENT_EXAMPLE.ts para integración completa"
