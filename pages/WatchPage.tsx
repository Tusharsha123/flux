
import React, { useState, useEffect, useRef } from 'react';
import { VideoRecord } from '../types';
import { storageService } from '../services/storageService';
import { dbService } from '../services/dbService';

interface WatchPageProps {
  record: VideoRecord;
  onBack: () => void;
}

const WatchPage: React.FC<WatchPageProps> = ({ record, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let url: string | null = null;
    const loadVideo = async () => {
      setLoading(true);
      try {
        const blob = await dbService.getBlob(record.id);
        if (blob) {
          url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
      } catch (e) {
        console.error("Flux: Vault hydration failed.", e);
      } finally {
        setLoading(false);
      }
    };
    loadVideo();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [record.id]);

  const getShareUrl = () => {
    try {
      // Robust URL generation to avoid the "double domain" concatenation issue
      const currentUrl = new URL(window.location.href);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.host}${currentUrl.pathname}`;
      return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}#/watch/${record.id}`;
    } catch (e) {
      return window.location.href.split('#')[0] + `#/watch/${record.id}`;
    }
  };

  const shareUrl = getShareUrl();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-2">
      <div className="bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-zinc-900 shadow-2xl">
         <div className="aspect-video bg-black relative flex items-center justify-center">
           {loading ? (
             <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
           ) : videoUrl ? (
             <video ref={videoRef} src={videoUrl} controls className="w-full h-full" autoPlay />
           ) : (
             <p className="text-zinc-600 text-xs font-bold uppercase">Video not found in local vault.</p>
           )}
         </div>
         <div className="p-10 bg-zinc-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-zinc-50 tracking-tighter">{record.title}</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    {(record.size / 1024 / 1024).toFixed(1)} MB &middot; {new Date(record.createdAt).toLocaleDateString()}
                  </p>
               </div>
               <div className="flex flex-col gap-3 min-w-[240px]">
                  <div className="flex gap-4">
                    <button onClick={copyToClipboard} className={`flex-1 px-8 py-3.5 rounded-2xl text-xs font-bold border transition-all ${copied ? 'bg-white text-zinc-900 border-white' : 'border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}>
                      {copied ? 'Link Copied' : 'Share Link'}
                    </button>
                    {videoUrl && <a href={videoUrl} download={`${record.id}.mp4`} className="px-8 py-3.5 rounded-2xl bg-zinc-100 text-zinc-950 text-xs font-bold transition-all hover:bg-white">Save</a>}
                  </div>
                  <div className="px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <p className="text-[9px] text-zinc-500 truncate font-mono">{shareUrl}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="p-8 bg-zinc-950/30 rounded-[2rem] border border-zinc-900/50 space-y-6">
           <h3 className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.4em]">Analytics</h3>
           <div className="flex gap-12">
              <div>
                 <p className="text-4xl font-bold text-zinc-100">{record.views}</p>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase">Views</p>
              </div>
              <div>
                 <p className="text-4xl font-bold text-zinc-100">{record.completionRate.toFixed(0)}%</p>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase">Completion</p>
              </div>
           </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/10 rounded-[2rem] border border-dashed border-zinc-800">
           <button onClick={onBack} className="px-8 py-3 rounded-2xl bg-zinc-100 text-zinc-950 font-black text-[10px] uppercase tracking-widest">New Recording</button>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
