
import { FFmpeg } from 'https://esm.sh/@ffmpeg/ffmpeg@0.12.10';

export class FFmpegService {
  private static instance: FFmpegService;
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;

  private constructor() {}

  static getInstance() {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  /**
   * Checks if the browser supports the security requirements for FFmpeg.wasm
   * (COOP/COEP headers allowing SharedArrayBuffer)
   */
  static isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  private async getBlobURL(packageName: string, filePath: string, mimeType: string): Promise<string> {
    const cdns = [
      `https://cdn.jsdelivr.net/npm/${packageName}/${filePath}`,
      `https://unpkg.com/${packageName}/${filePath}`,
      `https://esm.sh/${packageName}/${filePath}`
    ];

    let lastError: Error | null = null;

    for (const url of cdns) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        return URL.createObjectURL(new Blob([blob], { type: mimeType }));
      } catch (e: any) {
        lastError = e;
      }
    }
    throw new Error(`Failed to load ${filePath}: ${lastError?.message}`);
  }

  async load() {
    if (this.loaded) return;
    if (!FFmpegService.isSupported()) {
      throw new Error("COOP/COEP security headers are missing. Trimming is disabled in this environment.");
    }
    
    this.ffmpeg = new FFmpeg();
    const corePkg = '@ffmpeg/core@0.12.6';
    const ffmpegPkg = '@ffmpeg/ffmpeg@0.12.10';
    
    try {
      const [coreURL, wasmURL, workerURL] = await Promise.all([
        this.getBlobURL(corePkg, 'dist/esm/ffmpeg-core.js', 'text/javascript'),
        this.getBlobURL(corePkg, 'dist/esm/ffmpeg-core.wasm', 'application/wasm'),
        this.getBlobURL(ffmpegPkg, 'dist/esm/worker.js', 'text/javascript')
      ]);

      await this.ffmpeg.load({ coreURL, wasmURL, workerURL });
      this.loaded = true;
    } catch (err: any) {
      console.error('Flux Engine: FFmpeg failed to load.', err);
      throw err;
    }
  }

  async trimVideo(blob: Blob, start: number, end: number): Promise<Blob> {
    if (!this.ffmpeg || !this.loaded) await this.load();
    const ffmpeg = this.ffmpeg!;

    const inputName = 'input.webm';
    const outputName = 'output.mp4';
    const arrayBuffer = await blob.arrayBuffer();
    
    await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));

    await ffmpeg.exec([
      '-ss', start.toFixed(3),
      '-to', end.toFixed(3),
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'aac',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
  }
}
