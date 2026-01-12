
import React, { useState, useRef, useEffect } from 'react';

interface VideoEditorProps {
  videoBlob: Blob;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoBlob, onSave, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = useRef(URL.createObjectURL(videoBlob));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, []);

  /**
   * MVP Trim Hack: Slices the blob by bytes.
   * Note: This is an estimation based on average bitrate.
   * While not frame-accurate like FFmpeg, it bypasses all browser security blocks.
   */
  const handleTrim = async () => {
    setIsProcessing(true);
    
    // Calculate approximate byte offsets
    // Simple heuristic: total size / duration = bytes per second
    const bytesPerSecond = videoBlob.size / duration;
    const startByte = Math.floor(startTime * bytesPerSecond);
    const endByte = Math.floor(endTime * bytesPerSecond);

    // Give it a small delay for UI feedback
    setTimeout(() => {
      const trimmedBlob = videoBlob.slice(startByte, endByte, videoBlob.type);
      setIsProcessing(false);
      onSave(trimmedBlob);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Refine your Flux</h2>
        <p className="text-zinc-500 text-sm">
          Select the portion of your recording to keep.
        </p>
      </div>

      <div className="bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-900 shadow-2xl">
        <div className="aspect-video bg-black">
          <video ref={videoRef} src={videoUrl.current} controls className="w-full h-full" />
        </div>
        
        <div className="p-8 space-y-6 bg-zinc-950/50 backdrop-blur-xl">
           <div className="relative h-2 bg-zinc-900 rounded-full flex items-center">
              <input 
                type="range" min="0" max={duration || 100} step="0.1" value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(Math.min(val, endTime - 0.5));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 w-full z-30 pointer-events-auto opacity-0 cursor-pointer"
              />
              <input 
                type="range" min="0" max={duration || 100} step="0.1" value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(Math.max(val, startTime + 0.5));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 w-full z-20 pointer-events-auto opacity-0 cursor-pointer"
              />
              <div 
                className="absolute h-full bg-zinc-100 rounded-full z-10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                style={{ 
                  left: `${duration ? (startTime / duration) * 100 : 0}%`,
                  width: `${duration ? ((endTime - startTime) / duration) * 100 : 100}%`
                }}
              />
           </div>
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
              <span>Start: {startTime.toFixed(1)}s</span>
              <span className="text-zinc-100 font-bold">Trim Selection</span>
              <span>End: {endTime.toFixed(1)}s</span>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pb-12">
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-100 text-xs font-bold uppercase tracking-widest">Cancel</button>
        <button 
          disabled={isProcessing}
          onClick={handleTrim}
          className="bg-zinc-100 text-zinc-950 px-12 py-3.5 rounded-2xl font-bold transition-all shadow-xl hover:bg-white active:scale-95 disabled:opacity-50 min-w-[200px]"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-zinc-950" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Applying Trim...
            </span>
          ) : "Finalize & Share"}
        </button>
      </div>
    </div>
  );
};

export default VideoEditor;
