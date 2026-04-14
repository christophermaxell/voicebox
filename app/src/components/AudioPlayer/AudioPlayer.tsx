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
      waveColor: '#eab30840',
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

  const handleSeek = (value: number[]) => {
    if (wavesurferRef.current) {
      const time = (value[0] / 100) * duration;
      wavesurferRef.current.setTime(time);
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (isMuted && value[0] > 0) setIsMuted(false);
  };

  if (!audioUrl) return null;

  return (
    <div className="w-full bg-[#050505] border-t border-white/5 h-24 flex items-center px-4 relative z-50">
      <div className="flex w-full items-center gap-6 max-w-[1800px] mx-auto px-6">
        
        {/* Play Button Container */}
        <div className="flex items-center gap-4">
           <button 
             onClick={handlePlayPause}
             className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
           >
             {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
           </button>
        </div>

        {/* Waveform Visualization - Main Focus */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
           <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-4">
                 <span className="font-bold text-sm tracking-tight">{title || 'Studio Synthesis'}</span>
                 <div className="text-[10px] font-bold text-muted-foreground/40 font-mono">
                   {formatDuration(currentTime)} / {formatDuration(duration)}
                 </div>
              </div>
              {error && <div className="text-[10px] text-destructive font-bold uppercase tracking-widest">{error}</div>}
           </div>
           <div ref={waveformRef} className="w-full h-12 opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Controls Panel */}
        <div className="flex items-center gap-6 shrink-0 ml-10">
          <div className="flex items-center gap-2 w-28 group">
            <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-primary transition-colors">
               {isMuted || volume === 0 ? <Volume1 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5">
                <Repeat className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5">
                <Share2 className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5">
                <Download className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5" onClick={stop}>
                <MoreHorizontal className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
