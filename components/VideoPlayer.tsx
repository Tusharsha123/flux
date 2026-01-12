
import React, { useState, useEffect, useRef } from 'react';
import { VideoRecord } from '../types';
import { storageService } from '../services/storageService';

interface VideoPlayerProps {
  record: VideoRecord;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ record }) => {
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Generates a clean, shareable URL.
   * Using the native URL constructor is the most robust way to handle 
   * complex origins and avoid the "double domain" concatenation bug.
   */
  const getShareUrl = () => {
    try {
      const url = new URL(window.location.href);
      // Remove any existing hash and set the new one
      url.hash = `#/watch/${record.id}`;
      return url.toString();
    } catch (e) {
      // Fallback: robust string splitting
      const baseUrl = window.location.href.split('#')[0];
      const separator = baseUrl.endsWith('/') ? '' : '/';
      return `${baseUrl}${separator}#/watch/${record.id}`;
    }
  };

  const shareUrl = getShareUrl();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (!video.duration || video.duration === Infinity) return;
      const progress = (video.currentTime / video.duration) * 100;
      if (progress > 1) {
        storageService.updateCompletion(record.id, progress);
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [record.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Copy to clipboard failed:', err);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-2">
      <div className="bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-zinc-900 shadow-2xl">
         <div className="aspect-video bg-black relative">
           <video ref={videoRef} src={record.url} controls className="w-full h-full" autoPlay />
         </div>
         
         <div className="p-10 bg-zinc-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-zinc-50 tracking-tighter leading-tight">{record.title}</h1>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <span>{(record.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
               </div>
               
               <div className="flex flex-col gap-3 min-w-[240px]">
                  <div className="flex gap-4">
                    <button 
                      onClick={copyToClipboard}
                      className={`flex-1 px-8 py-3.5 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${copied ? 'bg-zinc-100 text-zinc-950 border-white' : 'border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`}
                    >
                      {copied ? 'Link Copied' : 'Share Link'}
                    </button>
                    <a 
                      href={record.url} download={`${record.id}.mp4`}
                      className="px-8 py-3.5 rounded-2xl bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-bold transition-all text-center"
                    >
                      Download
                    </a>
                  </div>
                  <div className="px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <p className="text-[9px] text-zinc-500 truncate font-mono">{shareUrl}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-zinc-900/50 pt-10 pb-20">
        <div className="p-8 bg-zinc-950/30 rounded-[2rem] border border-zinc-900/50 space-y-8">
           <h3 className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.4em]">Analytics</h3>
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <p className="text-5xl font-bold text-zinc-100 tracking-tighter">{record.views}</p>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Views</p>
              </div>
              <div className="space-y-1">
                 <p className="text-5xl font-bold text-zinc-100 tracking-tighter">{record.completionRate.toFixed(0)}%</p>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg Completion</p>
              </div>
           </div>
           <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-100 transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ width: `${record.completionRate}%` }} />
           </div>
        </div>

        <div className="flex flex-col justify-center text-center p-10 bg-zinc-900/10 rounded-[2rem] border border-dashed border-zinc-800 space-y-4">
           <p className="text-sm text-zinc-600 font-medium">Recorded with Flux</p>
           <button 
             onClick={() => window.location.hash = ''}
             className="mx-auto px-10 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-zinc-800"
           >
             Start New Record
           </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
