
import React, { useState, useRef, useEffect } from 'react';
import { FFmpegService } from '../services/ffmpegService';

interface VideoEditorProps {
  videoBlob: Blob;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoBlob, onSave, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef(URL.createObjectURL(videoBlob));

  useEffect(() => {
    setIsSupported(FFmpegService.isSupported());
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, []);

  const handleTrim = async () => {
    if (!isSupported) {
      onSave(videoBlob);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const ffmpeg = FFmpegService.getInstance();
      await ffmpeg.load();
      const trimmedBlob = await ffmpeg.trimVideo(videoBlob, startTime, endTime);
      onSave(trimmedBlob);
    } catch (err: any) {
      console.warn("Flux: Trimming failed, falling back to original.", err);
      setError("Note: Browser security prevents trimming. Saving original...");
      setTimeout(() => onSave(videoBlob), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Refine your Flux</h2>
        <p className="text-zinc-500 text-sm">
          {isSupported ? "Trim your recording for a perfect loop." : "Preview your recording before saving."}
        </p>
      </div>

      <div className="bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-900 shadow-2xl">
        <div className="aspect-video bg-black">
          <video ref={videoRef} src={videoUrl.current} controls className="w-full h-full" />
        </div>
        
        {isSupported ? (
          <div className="p-8 space-y-6 bg-zinc-950/50 backdrop-blur-xl">
             <div className="relative h-2 bg-zinc-900 rounded-full">
                <input 
                  type="range" min="0" max={duration || 100} step="0.1" value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(Math.min(val, endTime - 0.5));
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="absolute inset-0 w-full z-20 pointer-events-auto opacity-0 cursor-pointer"
                />
                <input 
                  type="range" min="0" max={duration || 100} step="0.1" value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(Math.max(val, startTime + 0.5));
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="absolute inset-0 w-full z-10 pointer-events-auto opacity-0 cursor-pointer"
                />
                <div 
                  className="absolute h-full bg-zinc-100 rounded-full z-0 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  style={{ 
                    left: `${duration ? (startTime / duration) * 100 : 0}%`,
                    width: `${duration ? ((endTime - startTime) / duration) * 100 : 100}%`
                  }}
                />
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <span>Start: {startTime.toFixed(1)}s</span>
                <span className="text-zinc-400">Duration: {(endTime - startTime).toFixed(1)}s</span>
                <span>End: {endTime.toFixed(1)}s</span>
             </div>
          </div>
        ) : (
          <div className="p-8 bg-zinc-900/30 text-center">
            <p className="text-xs text-zinc-500 font-medium">Trimming is disabled in this environment (COOP/COEP headers required).</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-100 text-xs font-bold uppercase tracking-widest">Cancel</button>
        <button 
          disabled={isProcessing}
          onClick={handleTrim}
          className="bg-zinc-100 text-zinc-950 px-12 py-3.5 rounded-2xl font-bold transition-all shadow-xl hover:bg-white active:scale-95 disabled:opacity-50 min-w-[180px]"
        >
          {isProcessing ? "Processing..." : isSupported ? "Trim & Share" : "Save & Share"}
        </button>
      </div>
      {error && <p className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
    </div>
  );
};

export default VideoEditor;
