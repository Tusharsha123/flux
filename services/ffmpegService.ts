
/**
 * FFmpeg is currently bypassed to avoid COOP/COEP header blocks 
 * in sandboxed environments. Slicing is handled via Blob API.
 */
export class FFmpegService {
  static isSupported(): boolean {
    return false;
  }
}
