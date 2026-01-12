
import React, { useState, useEffect } from 'react';
import { AppState, VideoRecord } from './types';
import RecordingStudio from './components/RecordingStudio';
import VideoEditor from './components/VideoEditor';
import WatchPage from './pages/WatchPage';
import { storageService } from './services/storageService';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentVideo, setCurrentVideo] = useState<Blob | null>(null);
  const [videoRecord, setVideoRecord] = useState<VideoRecord | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/watch/')) {
        const id = hash.replace('#/watch/', '');
        const record = storageService.getRecordById(id);
        
        if (record) {
          setVideoRecord(record);
          setAppState(AppState.VIEWING);
          storageService.incrementView(id);
          window.scrollTo(0, 0);
        } else {
          resetToHome();
        }
      } else if (hash === '' || hash === '#/') {
        if (appState === AppState.VIEWING) {
          resetToHome();
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [appState]);

  const resetToHome = () => {
    setAppState(AppState.IDLE);
    setVideoRecord(null);
    setCurrentVideo(null);
    if (window.location.hash !== '' && window.location.hash !== '#/') {
      window.location.hash = '';
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setCurrentVideo(blob);
    setAppState(AppState.EDITING);
  };

  const handleEditComplete = (finalBlob: Blob) => {
    setAppState(AppState.UPLOADING);
    setUploadProgress(0);
    
    // Simulation: Upload to local persistent vault
    const id = Math.random().toString(36).substring(2, 11);
    
    // Use an interval to simulate network delay/transcoding
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        
        // Save actual video data to IndexedDB
        await dbService.saveBlob(id, finalBlob);

        const newRecord: VideoRecord = {
          id,
          title: `Flux Session — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          url: '', // We don't store the URL, we hydrate it from DB on load
          duration: 0,
          createdAt: new Date().toISOString(),
          views: 0,
          completionRate: 0,
          size: finalBlob.size,
          mimeType: finalBlob.type
        };

        storageService.saveRecording(newRecord);
        
        // Redirect to new persistent link
        setTimeout(() => {
          window.location.hash = `#/watch/${id}`;
        }, 500);
      } else {
        setUploadProgress(progress);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-zinc-800">
      <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 border-b border-zinc-900/50 glass">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={resetToHome}
        >
          <div className="w-5 h-5 rounded-full border-2 border-zinc-100 flex items-center justify-center transition-transform group-hover:scale-110">
            <div className="w-1.5 h-1.5 bg-zinc-100 rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-100 uppercase tracking-[0.1em]">Flux</span>
        </div>
        
        <nav className="flex items-center gap-4">
          <button 
            onClick={() => {
              window.location.hash = '';
              setAppState(AppState.RECORDING);
            }}
            className="bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            New Record
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-zinc-50 leading-[0.85]">
                Record your flow. <br/><span className="text-zinc-700">Share instantly.</span>
              </h1>
              <p className="text-zinc-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
                Professional screen recording with built-in trimming and persistent local cloud storage.
              </p>
            </div>

            <button 
              onClick={() => setAppState(AppState.RECORDING)}
              className="group relative flex items-center gap-5 bg-zinc-100 hover:bg-white text-zinc-950 px-12 py-6 rounded-2xl transition-all shadow-2xl shadow-white/10 active:scale-95"
            >
              <span className="text-xl font-bold tracking-tight">Start Recording</span>
              <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {appState === AppState.RECORDING && (
          <RecordingStudio onComplete={handleRecordingComplete} onCancel={resetToHome} />
        )}

        {appState === AppState.EDITING && currentVideo && (
          <VideoEditor videoBlob={currentVideo} onSave={handleEditComplete} onCancel={resetToHome} />
        )}

        {appState === AppState.UPLOADING && (
          <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-10 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-3xl font-bold tracking-tighter text-zinc-50">Flux Vault Sync</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Optimizing for global delivery</p>
            </div>
            
            <div className="w-full max-w-md space-y-4">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                 <div 
                   className="h-full bg-zinc-100 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                   style={{ width: `${uploadProgress}%` }}
                 />
              </div>
              <div className="flex justify-between items-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                <span>Sync Progress</span>
                <span className="text-zinc-100">{Math.floor(uploadProgress)}%</span>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.VIEWING && videoRecord && (
          <WatchPage record={videoRecord} onBack={resetToHome} />
        )}
      </main>

      <footer className="py-20 border-t border-zinc-900/30 text-center opacity-30 mt-auto">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-px bg-zinc-700" />
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.5em]">Flux Engine &middot; Persistent Architecture</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
