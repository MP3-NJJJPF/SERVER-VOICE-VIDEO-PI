/**
 * EJEMPLO DE IMPLEMENTACIÓN DE VIDEO EN EL CLIENTE
 *
 * Este archivo muestra cómo integrar la funcionalidad de video
 * en tu aplicación cliente (React, Vue, Angular, etc.)
 */

// ============================================
// 1. CONFIGURACIÓN INICIAL
// ============================================

import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});

// Estado local del usuario
let localStream = null;
let videoEnabled = true;
let audioEnabled = true;
let peerConnections = {}; // Map de userId -> RTCPeerConnection

// ============================================
// 2. OBTENER STREAM LOCAL (AUDIO + VIDEO)
// ============================================

async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    });

    // Mostrar video local en la UI
    const localVideoElement = document.getElementById('local-video');
    localVideoElement.srcObject = localStream;

    console.log('Stream local obtenido:', {
      audioTracks: localStream.getAudioTracks().length,
      videoTracks: localStream.getVideoTracks().length,
    });

    return localStream;
  } catch (error) {
    console.error('Error obteniendo stream local:', error);
    throw error;
  }
}

// ============================================
// 3. UNIRSE A UNA REUNIÓN
// ============================================

async function joinMeeting(meetingId, userId, userName) {
  try {
    // Obtener stream local primero
    await getLocalStream();

    // Unirse vía HTTP API
    const response = await fetch(`/api/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer YOUR_JWT_TOKEN`,
        'Content-Type': 'application/json',
      },
    });

    const { meeting, audioStream, videoStream } = await response.json();
    console.log('Reunión joined:', meeting);
    console.log('Audio Stream ID:', audioStream.streamId);
    console.log('Video Stream ID:', videoStream.streamId);

    // Unirse vía Socket.io
    socket.emit(
      'join-meeting',
      {
        userId,
        meetingId,
        userName,
      },
      (response) => {
        if (response.success) {
          console.log('Socket conectado a la reunión');
        }
      }
    );

    // Configurar listeners de Socket.io
    setupSocketListeners();
  } catch (error) {
    console.error('Error joining meeting:', error);
  }
}

// ============================================
// 4. CONFIGURAR LISTENERS DE SOCKET.IO
// ============================================

function setupSocketListeners() {
  // Cuando un nuevo usuario se une
  socket.on('user-joined', async (data) => {
    console.log('Nuevo usuario:', data.userId);

    // Si debes iniciar la conexión
    if (data.shouldInitiate) {
      await createPeerConnection(data.userId, true);
    } else {
      // Preparar para recibir offer
      await createPeerConnection(data.userId, false);
    }
  });

  // Cuando un usuario sale
  socket.on('user-left', (data) => {
    console.log('Usuario salió:', data.userId);
    closePeerConnection(data.userId);
  });

  // Cambio de estado de audio de otro usuario
  socket.on('audio-state-changed', (data) => {
    console.log(
      `Usuario ${data.userId} ${data.isMuted ? 'muteó' : 'desmuteó'} su audio`
    );
    updateRemoteAudioUI(data.userId, data.isMuted);
  });

  // Cambio de estado de video de otro usuario
  socket.on('video-state-changed', (data) => {
    console.log(
      `Usuario ${data.userId} ${
        data.isVideoOff ? 'desactivó' : 'activó'
      } su cámara`
    );
    updateRemoteVideoUI(data.userId, data.isVideoOff);
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', handleWebRTCOffer);
  socket.on('webrtc-answer', handleWebRTCAnswer);
  socket.on('ice-candidate', handleICECandidate);
}

// ============================================
// 5. CREAR CONEXIÓN WEBRTC
// ============================================

async function createPeerConnection(remoteUserId, shouldCreateOffer) {
  try {
    // Obtener configuración de ICE servers
    const iceResponse = await fetch('/api/ice-servers');
    const { iceServers } = await iceResponse.json();

    // Crear peer connection
    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnections[remoteUserId] = peerConnection;

    // Agregar tracks locales
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Manejar tracks remotos
    peerConnection.ontrack = (event) => {
      console.log('Track remoto recibido de:', remoteUserId);
      const remoteStream = event.streams[0];
      displayRemoteVideo(remoteUserId, remoteStream);
    };

    // Manejar ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          from: socket.userId, // Tu userId
          to: remoteUserId,
          candidate: event.candidate,
          meetingId: socket.currentMeetingId,
        });
      }
    };

    // Estado de conexión
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Conexión con ${remoteUserId}:`,
        peerConnection.connectionState
      );
    };

    // Crear offer si corresponde
    if (shouldCreateOffer) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        from: socket.userId,
        to: remoteUserId,
        offer: peerConnection.localDescription,
        meetingId: socket.currentMeetingId,
      });
    }
  } catch (error) {
    console.error('Error creando peer connection:', error);
  }
}

// ============================================
// 6. MANEJAR SEÑALIZACIÓN WEBRTC
// ============================================

async function handleWebRTCOffer(data) {
  console.log('Offer recibido de:', data.from);

  const peerConnection = peerConnections[data.from];
  if (!peerConnection) {
    console.error('Peer connection no existe para:', data.from);
    return;
  }

  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('webrtc-answer', {
      from: socket.userId,
      to: data.from,
      answer: peerConnection.localDescription,
      meetingId: socket.currentMeetingId,
    });
  } catch (error) {
    console.error('Error manejando offer:', error);
  }
}

async function handleWebRTCAnswer(data) {
  console.log('Answer recibido de:', data.from);

  const peerConnection = peerConnections[data.from];
  if (!peerConnection) {
    console.error('Peer connection no existe para:', data.from);
    return;
  }

  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } catch (error) {
    console.error('Error manejando answer:', error);
  }
}

async function handleICECandidate(data) {
  const peerConnection = peerConnections[data.from];
  if (!peerConnection) {
    console.error('Peer connection no existe para:', data.from);
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } catch (error) {
    console.error('Error agregando ICE candidate:', error);
  }
}

// ============================================
// 7. TOGGLE VIDEO (ACTIVAR/DESACTIVAR CÁMARA)
// ============================================

function toggleVideo() {
  if (!localStream) return;

  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoEnabled = !videoEnabled;
    videoTrack.enabled = videoEnabled;

    // Notificar a otros usuarios
    socket.emit('toggle-video', {
      userId: socket.userId,
      meetingId: socket.currentMeetingId,
      isVideoOff: !videoEnabled,
    });

    console.log('Video:', videoEnabled ? 'ON' : 'OFF');
    updateLocalVideoUI();
  }
}

// ============================================
// 8. TOGGLE AUDIO (MUTEAR/DESMUTEAR)
// ============================================

function toggleAudio() {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioEnabled = !audioEnabled;
    audioTrack.enabled = audioEnabled;

    // Notificar a otros usuarios
    socket.emit('toggle-audio', {
      userId: socket.userId,
      meetingId: socket.currentMeetingId,
      isMuted: !audioEnabled,
    });

    console.log('Audio:', audioEnabled ? 'ON' : 'OFF');
    updateLocalAudioUI();
  }
}

// ============================================
// 9. CAMBIAR CALIDAD DE VIDEO
// ============================================

async function changeVideoQuality(videoStreamId, quality) {
  try {
    const response = await fetch(
      `/api/video/streams/${videoStreamId}/quality`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer YOUR_JWT_TOKEN`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quality }), // 'low', 'medium', 'high', 'hd'
      }
    );

    const result = await response.json();
    console.log('Calidad de video cambiada:', result);

    // Aplicar constraints al track local
    const videoTrack = localStream.getVideoTracks()[0];
    const constraints = getVideoConstraints(quality);
    await videoTrack.applyConstraints(constraints);
  } catch (error) {
    console.error('Error cambiando calidad:', error);
  }
}

function getVideoConstraints(quality) {
  const constraints = {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 24 },
    high: { width: 1280, height: 720, frameRate: 30 },
    hd: { width: 1920, height: 1080, frameRate: 30 },
  };
  return constraints[quality] || constraints['high'];
}

// ============================================
// 10. MOSTRAR VIDEOS EN LA UI
// ============================================

function displayRemoteVideo(userId, stream) {
  // Crear o actualizar elemento de video
  let videoElement = document.getElementById(`remote-video-${userId}`);

  if (!videoElement) {
    videoElement = document.createElement('video');
    videoElement.id = `remote-video-${userId}`;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    document
      .getElementById('remote-videos-container')
      .appendChild(videoElement);
  }

  videoElement.srcObject = stream;
}

function updateLocalVideoUI() {
  const videoElement = document.getElementById('local-video');
  videoElement.classList.toggle('video-off', !videoEnabled);
}

function updateLocalAudioUI() {
  const muteButton = document.getElementById('mute-button');
  muteButton.textContent = audioEnabled ? '🎤' : '🔇';
}

function updateRemoteVideoUI(userId, isVideoOff) {
  const videoElement = document.getElementById(`remote-video-${userId}`);
  if (videoElement) {
    videoElement.classList.toggle('video-off', isVideoOff);
  }
}

function updateRemoteAudioUI(userId, isMuted) {
  const audioIndicator = document.getElementById(`audio-indicator-${userId}`);
  if (audioIndicator) {
    audioIndicator.textContent = isMuted ? '🔇' : '🎤';
  }
}

// ============================================
// 11. SALIR DE LA REUNIÓN
// ============================================

function leaveMeeting() {
  // Detener tracks locales
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Cerrar todas las conexiones
  Object.keys(peerConnections).forEach((userId) => {
    closePeerConnection(userId);
  });

  // Emitir evento de salida
  socket.emit('leave-meeting', {
    userId: socket.userId,
    meetingId: socket.currentMeetingId,
  });

  console.log('Saliste de la reunión');
}

function closePeerConnection(userId) {
  const peerConnection = peerConnections[userId];
  if (peerConnection) {
    peerConnection.close();
    delete peerConnections[userId];
  }

  // Remover video de la UI
  const videoElement = document.getElementById(`remote-video-${userId}`);
  if (videoElement) {
    videoElement.remove();
  }
}

// ============================================
// 12. EJEMPLO DE USO EN HTML
// ============================================

/*
<!DOCTYPE html>
<html>
<head>
  <title>Video Meeting</title>
  <style>
    .video-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
    video { width: 100%; height: auto; border-radius: 8px; }
    .video-off { opacity: 0.3; }
    .controls { margin-top: 20px; }
    button { padding: 10px 20px; margin: 5px; font-size: 16px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Video Meeting</h1>
  
  <div class="video-container">
    <div>
      <h3>Tu Video</h3>
      <video id="local-video" autoplay muted playsinline></video>
    </div>
    <div id="remote-videos-container">
      <!-- Videos remotos se agregan aquí dinámicamente -->
    </div>
  </div>

  <div class="controls">
    <button id="mute-button" onclick="toggleAudio()">🎤</button>
    <button id="video-button" onclick="toggleVideo()">📹</button>
    <button onclick="changeVideoQuality(videoStreamId, 'hd')">HD</button>
    <button onclick="changeVideoQuality(videoStreamId, 'medium')">SD</button>
    <button onclick="leaveMeeting()">Salir</button>
  </div>

  <script src="client-video-example.js"></script>
</body>
</html>
*/

// ============================================
// EXPORTAR FUNCIONES (SI USAS MÓDULOS)
// ============================================

export {
  getLocalStream,
  joinMeeting,
  toggleVideo,
  toggleAudio,
  changeVideoQuality,
  leaveMeeting,
};
