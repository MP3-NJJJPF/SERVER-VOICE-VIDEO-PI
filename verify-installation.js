#!/usr/bin/env node

/**
 * VERIFICADOR DE INSTALACIÓN
 * Script para verificar que todo esté correctamente configurado
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🔍 VERIFICADOR DE INSTALACIÓN - SERVIDOR DE VOZ         ║
╚════════════════════════════════════════════════════════════╝
`);

let checks = 0;
let passed = 0;

function check(name, condition) {
  checks++;
  const icon = condition ? '✅' : '❌';
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}... ${status}`);
  if (condition) passed++;
  return condition;
}

console.log('\n📋 VERIFICANDO ARCHIVOS...\n');

// Verificar archivos principales
check('package.json existe', fs.existsSync('package.json'));
check('tsconfig.json existe', fs.existsSync('tsconfig.json'));
check('.eslintrc.json existe', fs.existsSync('.eslintrc.json'));
check('.gitignore existe', fs.existsSync('.gitignore'));
check('.env.example existe', fs.existsSync('.env.example'));

console.log('\n📁 VERIFICANDO CARPETAS...\n');

// Verificar carpetas
check('src/ existe', fs.existsSync('src'));
check('src/config/ existe', fs.existsSync('src/config'));
check('src/controllers/ existe', fs.existsSync('src/controllers'));
check('src/services/ existe', fs.existsSync('src/services'));
check('src/routes/ existe', fs.existsSync('src/routes'));
check('src/middlewares/ existe', fs.existsSync('src/middlewares'));
check('src/models/ existe', fs.existsSync('src/models'));
check('src/utils/ existe', fs.existsSync('src/utils'));

console.log('\n💻 VERIFICANDO CÓDIGO...\n');

// Verificar archivos TypeScript
check('src/index.ts existe', fs.existsSync('src/index.ts'));
check('src/config/firebase.ts existe', fs.existsSync('src/config/firebase.ts'));
check('src/services/meetingService.ts existe', fs.existsSync('src/services/meetingService.ts'));
check('src/services/audioService.ts existe', fs.existsSync('src/services/audioService.ts'));
check('src/controllers/meetingController.ts existe', fs.existsSync('src/controllers/meetingController.ts'));
check('src/controllers/audioController.ts existe', fs.existsSync('src/controllers/audioController.ts'));
check('src/routes/meetings.ts existe', fs.existsSync('src/routes/meetings.ts'));
check('src/routes/audio.ts existe', fs.existsSync('src/routes/audio.ts'));
check('src/middlewares/auth.ts existe', fs.existsSync('src/middlewares/auth.ts'));
check('src/models/types.ts existe', fs.existsSync('src/models/types.ts'));
check('src/utils/socketHandler.ts existe', fs.existsSync('src/utils/socketHandler.ts'));
check('src/utils/helpers.ts existe', fs.existsSync('src/utils/helpers.ts'));

console.log('\n📚 VERIFICANDO DOCUMENTACIÓN...\n');

// Verificar documentación
check('README.md existe', fs.existsSync('README.md'));
check('QUICKSTART.md existe', fs.existsSync('QUICKSTART.md'));
check('INTEGRATION_VIDEO.md existe', fs.existsSync('INTEGRATION_VIDEO.md'));
check('PROJECT_SUMMARY.md existe', fs.existsSync('PROJECT_SUMMARY.md'));
check('CLIENT_EXAMPLE.ts existe', fs.existsSync('CLIENT_EXAMPLE.ts'));

console.log('\n🐳 VERIFICANDO DOCKER...\n');

// Verificar Docker
check('Dockerfile existe', fs.existsSync('Dockerfile'));
check('docker-compose.yml existe', fs.existsSync('docker-compose.yml'));

console.log('\n🧪 VERIFICANDO TESTS...\n');

// Verificar tests
check('test_server.sh existe', fs.existsSync('test_server.sh'));

console.log('\n📦 VERIFICANDO DEPENDENCIES...\n');

// Verificar package.json
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const deps = pkg.dependencies || {};
  check('express en dependencias', 'express' in deps);
  check('socket.io en dependencias', 'socket.io' in deps);
  check('firebase-admin en dependencias', 'firebase-admin' in deps);
  check('typescript en devDependencies', 'typescript' in (pkg.devDependencies || {}));
  
  const scripts = pkg.scripts || {};
  check('Script: start', 'start' in scripts);
  check('Script: dev', 'dev' in scripts);
  check('Script: build', 'build' in scripts);
  check('Script: lint', 'lint' in scripts);
} catch (e) {
  check('package.json válido', false);
}

console.log('\n🔐 VERIFICANDO CONFIGURACIÓN...\n');

// Verificar .env
const envExists = fs.existsSync('.env');
check('.env existe', envExists);

if (envExists) {
  const env = fs.readFileSync('.env', 'utf8');
  check('FIREBASE_PROJECT_ID configurado', env.includes('FIREBASE_PROJECT_ID='));
  check('FIREBASE_PRIVATE_KEY configurado', env.includes('FIREBASE_PRIVATE_KEY='));
  check('FIREBASE_CLIENT_EMAIL configurado', env.includes('FIREBASE_CLIENT_EMAIL='));
}

console.log('\n📊 RESUMEN...\n');

const percentage = Math.round((passed / checks) * 100);
console.log(`✅ Pasadas: ${passed}/${checks} (${percentage}%)`);

if (percentage === 100) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ VERIFICACIÓN COMPLETADA - LISTO PARA USAR            ║
╚════════════════════════════════════════════════════════════╝

🚀 Próximos pasos:
  1. npm install
  2. Verificar .env con credenciales Firebase
  3. npm run dev
  4. Ver QUICKSTART.md para más detalles
  `);
  process.exit(0);
} else if (percentage >= 80) {
  console.log(`
⚠️  VERIFICACIÓN PARCIAL - Verifica los errores arriba
  `);
  process.exit(1);
} else {
  console.log(`
❌ VERIFICACIÓN FALLIDA - Faltan archivos importantes
  `);
  process.exit(1);
}
