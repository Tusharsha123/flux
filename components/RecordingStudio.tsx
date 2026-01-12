
import React, { useState, useRef, useEffect } from 'react';

interface RecordingStudioProps {
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const RecordingStudio: React.FC<RecordingStudioProps> = ({ onComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      window.focus();
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
      } catch (e) { console.warn("Mic bypassed — using system audio only."); }

      const tracks = [...displayStream.getVideoTracks()];
      displayStream.getAudioTracks().forEach(t => tracks.push(t));
      if (audioStream) audioStream.getAudioTracks().forEach(t => tracks.push(t));

      const combinedStream = new MediaStream(tracks);
      setStream(combinedStream);
      if (videoRef.current) videoRef.current.srcObject = combinedStream;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const recorder = new MediaRecorder(combinedStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onComplete(blob);
        displayStream.getTracks().forEach(t => t.stop());
        if (audioStream) audioStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    } catch (err: any) {
      console.error(err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stream?.getTracks().forEach(t => t.stop());
  }, [stream]);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">The Studio</h2>
        <p className="text-zinc-500 text-sm">Capture your screen and voice in one click.</p>
      </div>

      <div className="bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-zinc-900 shadow-2xl relative group">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="w-full aspect-video bg-zinc-900 object-cover opacity-80" 
        />
        
        {!isRecording && !stream && (
          <div className="absolute inset-0 flex items-center justify-center glass z-10">
            <div className="text-center space-y-6 px-12">
              <p className="text-zinc-400 text-sm font-medium">Flux needs your permission to see the screen.</p>
              <button 
                onClick={startRecording}
                className="bg-white text-zinc-950 px-10 py-3.5 rounded-2xl font-bold transition-all shadow-xl hover:px-12 active:scale-95"
              >
                Allow & Start
              </button>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-8 left-8 flex items-center gap-3 glass border border-zinc-800/50 px-4 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"></div>
            <span className="text-xs font-mono font-bold text-zinc-100 tracking-tighter">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {isRecording ? (
          <button 
            onClick={stopRecording}
            className="group flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-2xl shadow-white/10">
              <div className="w-6 h-6 bg-zinc-950 rounded-md" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-100 transition-colors">Finish Recording</span>
          </button>
        ) : stream ? (
          <button 
            onClick={() => setIsRecording(true)} 
            className="bg-zinc-100 text-zinc-950 px-8 py-3 rounded-2xl font-bold"
          >
            Begin Capture
          </button>
        ) : (
          <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-widest transition-colors">Go Back</button>
        )}
      </div>
    </div>
  );
};

export default RecordingStudio;
