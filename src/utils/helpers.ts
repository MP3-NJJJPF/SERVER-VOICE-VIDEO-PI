/**
 * Utilidades del servidor de voz
 */

/**
 * Formatear timestamp para logs
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validar UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validar calidad de audio
 */
export function isValidAudioQuality(
  quality: string
): quality is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(quality);
}

/**
 * Obtener bitrate según calidad
 */
export function getBitrateForQuality(quality: 'low' | 'medium' | 'high'): number {
  const bitrates = {
    low: 32000, // 32 kbps
    medium: 64000, // 64 kbps
    high: 128000, // 128 kbps
  };
  return bitrates[quality];
}

/**
 * Convertir bytes a formato legible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calcular duración formateada
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Retry con exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = initialDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Sanitizar entrada de usuario
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .substring(0, 255)
    .replace(/[<>]/g, '');
}
