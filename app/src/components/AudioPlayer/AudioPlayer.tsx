import {
  Pause,
  Play,
  Volume2,
  Download,
  Share2,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Activity,
  Maximize2,
  ExternalLink,
  Repeat,
  Volume1,
  Mic2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils/format';
import { debug } from '@/lib/utils/debug';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlatform } from '@/platform/PlatformContext';
import { cn } from '@/lib/utils/cn';

export function AudioPlayer() {
  const platform = usePlatform();
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const audioId = usePlayerStore((state) => state.audioId);
  const title = usePlayerStore((state) => state.title);
  const profileId = usePlayerStore((state) => state.profileId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const duration = usePlayerStore((state) => state.duration);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const stop = usePlayerStore((state) => state.stop);

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#eab30820',
      progressColor: '#eab308',
      cursorColor: '#eab308',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 3,
      barRadius: 4,
      height: 48,
      normalize: true,
      fillParent: true,
      mediaControls: false,
      interact: true,
      dragToSeek: true,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      if (isPlaying) {
        ws.play().catch(e => setError(e.message));
      }
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('seek', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('finish', () => {
      setIsPlaying(false);
    });

    ws.on('error', (err) => {
      debug.error('WaveSurfer error:', err);
      setError(err);
    });

    return () => {
      ws.destroy();
    };
  }, []);

  // Handle source changes
  useEffect(() => {
    if (wavesurferRef.current && audioUrl) {
      setError(null);
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  // Handle play/pause
  useEffect(() => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.play().catch(e => {
        debug.error('Playback error:', e);
        setError(e.message);
        setIsPlaying(false);
      });
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioUrl) return;
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (isMuted && value[0] > 0) setIsMuted(false);
  };

  if (!audioUrl) return null;

  return (
    <div className="w-full bg-[#050505]/95 backdrop-blur-md border-t border-white/[0.04] h-20 fixed bottom-0 left-0 right-0 z-[200] px-8 flex items-center justify-between">
       {/* 1. Play Button (FAR LEFT as per screenshot) */}
       <div className="shrink-0 mr-10">
          <button 
             onClick={handlePlayPause}
             className="text-foreground hover:scale-110 active:scale-95 transition-all p-2"
           >
             {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current" />}
           </button>
       </div>

       {/* 2. Waveform visualization (THE ENTIRE MIDDLE-LEFT) */}
       <div className="flex-1 h-12 flex flex-col justify-center relative">
          <div ref={waveformRef} className="w-full opacity-60" />
       </div>

       {/* 3. Status, Controls & Options (FAR RIGHT) */}
       <div className="shrink-0 ml-12 flex items-center gap-10">
          {/* Time & Title */}
          <div className="flex flex-col gap-0.5 min-w-[300px] pointer-events-none">
             <div className="flex items-center gap-4 text-[13px] font-bold tracking-tight">
                <span className="text-muted-foreground">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                <span className="text-foreground truncate opacity-80">{title}</span>
             </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-4 border-l border-white/[0.05] pl-10">
             <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
                <Repeat className="h-4 w-4" />
             </button>
             <div className="flex items-center gap-3 w-32 group">
                <Volume2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-full"
                />
             </div>
             <button onClick={stop} className="text-muted-foreground hover:text-foreground transition-colors p-2">
                <X className="h-4 w-4" />
             </button>
          </div>
       </div>
    </div>
  );
}
