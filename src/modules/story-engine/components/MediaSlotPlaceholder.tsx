import React, { useState, useEffect } from 'react';
import { Play, Volume2, Film, Radio } from 'lucide-react';
import { soundEngine } from '@/modules/audio/soundEngine';

export interface MediaSlotProps {
  heroImage?: string;
  videoUrl?: string;
  title: string;
  quickFact: string;
  nasaMission: string;
}

export const MediaSlotPlaceholder: React.FC<MediaSlotProps> = ({
  heroImage,
  videoUrl,
  title,
  quickFact,
  nasaMission
}) => {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ytError, setYtError] = useState(false);

  // Stop speaking when unmounted
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Chipi-Bot Text-to-Speech audio reader
  const handlePlayVoice = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    soundEngine.playClick(1200);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Transmission from ${nasaMission}. Scientific discovery: ${quickFact}`
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.25; // Chipi-Bot cheerful robotic cadet pitch

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Convert regular YouTube link to nocookie embed
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (url.includes('watch?v=')) {
        const id = url.split('watch?v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  const isLocalVideo = videoUrl && !isYouTube;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,0,0,0.8)] aspect-video flex flex-col justify-between">
      {/* 1. Playing Active Video Stream */}
      {isPlayingVideo && videoUrl && !ytError ? (
        <div className="relative w-full h-full bg-black">
          {isYouTube ? (
            <iframe
              src={getEmbedUrl(videoUrl)}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setYtError(true)}
            />
          ) : isLocalVideo ? (
            <video
              src={videoUrl}
              poster={heroImage}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              onError={() => setYtError(true)}
            />
          ) : null}

          <button
            onClick={() => setIsPlayingVideo(false)}
            className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700"
          >
            ✕ Close Video
          </button>
        </div>
      ) : (
        /* 2. Holographic Radar Poster & Decoded Transmission Fallback */
        <div className="relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
          {/* Subtle Scanlines Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,240,255,0.04)_50%)] bg-[length:100%_4px] pointer-events-none" />

          {/* Top Status Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                JPL EARTH UPLINK // DECODED TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {nasaMission}
            </span>
          </div>

          {/* Center Hologram Specimen Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)] text-cyan-300">
              <Film className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto line-clamp-2 mt-1">
                {quickFact}
              </p>
            </div>
          </div>

          {/* Bottom Action Bar: Play Video + Play Chipi Voice */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
            {videoUrl && !ytError ? (
              <button
                onClick={() => {
                  soundEngine.playClick(1400);
                  setIsPlayingVideo(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY NASA MISSION CLIP</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>ORBITAL DOWNLINK READY</span>
              </div>
            )}

            {/* Chipi-Bot Voice Readout */}
            <button
              onClick={handlePlayVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
              }`}
              title="Chipi-Bot Text-to-Speech audio synthesis"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'CHIPI READING...' : 'CHIPI VOICE BRIEF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaSlotPlaceholder;
