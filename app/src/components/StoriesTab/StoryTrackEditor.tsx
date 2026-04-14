import {
  Copy,
  GripHorizontal,
  Minus,
  Pause,
  Play,
  Plus,
  Scissors,
  Square,
  Trash2,
  Trash,
  Link,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import type { StoryItemDetail } from '@/lib/api/types';
import {
  useDuplicateStoryItem,
  useMoveStoryItem,
  useRemoveStoryItem,
  useSplitStoryItem,
  useTrimStoryItem,
} from '@/lib/hooks/useStories';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';
import { Slider } from '@/components/ui/slider';

function ClipWaveform({
  generationId,
  width,
  trimStartMs,
  trimEndMs,
  duration,
}: {
  generationId: string;
  width: number;
  trimStartMs: number;
  trimEndMs: number;
  duration: number;
}) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const effectiveDurationMs = duration * 1000 - trimStartMs - trimEndMs;
  const fullWaveformWidth = effectiveDurationMs > 0 ? (width / effectiveDurationMs) * (duration * 1000) : width;
  const offsetX = effectiveDurationMs > 0 ? (trimStartMs / (duration * 1000)) * fullWaveformWidth : 0;

  useEffect(() => {
    if (!waveformRef.current || fullWaveformWidth < 10) return;
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#eab30840',
      progressColor: '#eab308',
      cursorWidth: 0,
      barWidth: 2,
      barRadius: 2,
      barGap: 2,
      height: 24,
      normalize: true,
      interact: false,
    });

    const audioUrl = apiClient.getAudioUrl(generationId);
    wavesurfer.load(audioUrl).catch(() => {});
    return () => wavesurfer.destroy();
  }, [generationId, fullWaveformWidth]);

  return (
    <div className="w-full h-full opacity-80 overflow-hidden pointer-events-none">
      <div ref={waveformRef} style={{ width: `${fullWaveformWidth}px`, transform: `translateX(-${offsetX}px)` }} className="h-full" />
    </div>
  );
}

interface StoryTrackEditorProps {
  storyId: string;
  items: StoryItemDetail[];
}

const TRACK_HEIGHT = 44;
const TIME_RULER_HEIGHT = 0; 
const MIN_PIXELS_PER_SECOND = 10;
const MAX_PIXELS_PER_SECOND = 400;
const DEFAULT_PIXELS_PER_SECOND = 60;
const DEFAULT_TRACKS = [1, 0, -1];

export function StoryTrackEditor({ storyId, items }: StoryTrackEditorProps) {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const tracksRef = useRef<HTMLDivElement>(null);
  const moveItem = useMoveStoryItem();
  const duplicateItem = useDuplicateStoryItem();
  const removeItem = useRemoveStoryItem();
  const { toast } = useToast();

  const selectedClipId = useStoryStore((state) => state.selectedClipId);
  const setSelectedClipId = useStoryStore((state) => state.setSelectedClipId);

  const editorHeight = useStoryStore((state) => state.trackEditorHeight);
  const isPlaying = useStoryStore((state) => state.isPlaying);
  const currentTimeMs = useStoryStore((state) => state.currentTimeMs);
  const playbackStoryId = useStoryStore((state) => state.playbackStoryId);
  const play = useStoryStore((state) => state.play);
  const pause = useStoryStore((state) => state.pause);
  const stop = useStoryStore((state) => state.stop);
  const seek = useStoryStore((state) => state.seek);
  const setActiveStory = useStoryStore((state) => state.setActiveStory);

  const isActiveStory = playbackStoryId === storyId;
  const isCurrentlyPlaying = isPlaying && isActiveStory;

  useEffect(() => {
    if (items.length > 0 && !isActiveStory) {
      const totalDuration = Math.max(...items.map((i) => i.start_time_ms + i.duration * 1000 - (i.trim_start_ms || 0) - (i.trim_end_ms || 0)), 0);
      setActiveStory(storyId, items, totalDuration);
    }
  }, [storyId, items, isActiveStory, setActiveStory]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.start_time_ms - b.start_time_ms), [items]);

  const handlePlayPause = () => { if (isCurrentlyPlaying) pause(); else play(storyId, sortedItems); };

  const tracks = useMemo(() => {
    const trackSet = new Set([...DEFAULT_TRACKS, ...items.map((i) => i.track)]);
    return Array.from(trackSet).sort((a, b) => b - a);
  }, [items]);

  const getEffectiveDuration = (item: StoryItemDetail) => item.duration * 1000 - (item.trim_start_ms || 0) - (item.trim_end_ms || 0);

  const totalDurationMs = useMemo(() => {
    if (items.length === 0) return 10000;
    return Math.max(...items.map((i) => i.start_time_ms + getEffectiveDuration(i)), 10000);
  }, [items]);

  const msToPixels = useCallback((ms: number) => (ms / 1000) * pixelsPerSecond, [pixelsPerSecond]);
  const pixelsToMs = useCallback((px: number) => (px / pixelsPerSecond) * 1000, [pixelsPerSecond]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tracksRef.current || draggingItem) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + tracksRef.current.scrollLeft;
    seek(Math.max(0, pixelsToMs(x)));
    setSelectedClipId(null);
  };

  const handleDragStart = (e: React.MouseEvent, item: StoryItemDetail) => {
    e.stopPropagation();
    if (!tracksRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPosition({
      x: rect.left - tracksRef.current.getBoundingClientRect().left + tracksRef.current.scrollLeft,
      y: rect.top - tracksRef.current.getBoundingClientRect().top
    });
    setDraggingItem(item.id);
    setSelectedClipId(item.id);
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!draggingItem || !tracksRef.current) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + tracksRef.current.scrollLeft - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    setDragPosition({ x: Math.max(0, x), y });
  }, [draggingItem, dragOffset]);

  const handleDragEnd = useCallback(() => {
    if (!draggingItem || !tracksRef.current) { setDraggingItem(null); return; }
    const item = items.find((i) => i.id === draggingItem);
    if (!item) { setDraggingItem(null); return; }

    const newTimeMs = Math.max(0, Math.round(pixelsToMs(dragPosition.x)));
    const trackIndex = Math.floor(dragPosition.y / TRACK_HEIGHT);
    const clampedTrackIndex = Math.max(0, Math.min(trackIndex, tracks.length - 1));
    const newTrack = tracks[clampedTrackIndex] ?? 0;

    if (newTimeMs !== item.start_time_ms || newTrack !== item.track) {
      moveItem.mutate({ storyId, itemId: item.id, data: { start_time_ms: newTimeMs, track: newTrack } });
    }
    setDraggingItem(null);
  }, [draggingItem, dragPosition, items, tracks, pixelsToMs, storyId, moveItem]);

  useEffect(() => {
    if (draggingItem) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd); };
    }
  }, [draggingItem, handleDragMove, handleDragEnd]);

  const getClipStyle = (item: StoryItemDetail) => {
    const isDragging = draggingItem === item.id;
    const trackIndex = tracks.indexOf(item.track);
    const width = msToPixels(getEffectiveDuration(item));
    const left = isDragging ? dragPosition.x : msToPixels(item.start_time_ms);
    const top = isDragging ? dragPosition.y : trackIndex * TRACK_HEIGHT;
    return { width: `${width}px`, left: `${left}px`, top: `${top}px`, height: `${TRACK_HEIGHT - 4}px` };
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#08090a] border-t border-white/[0.04] z-[100] h-[180px] flex flex-col">
       {/* Top Control Bar */}
       <div className="h-10 flex items-center justify-between px-6 border-b border-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/5">
                 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handlePlayPause}>
                    {isCurrentlyPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                 </Button>
             </div>
             <div className="text-[11px] font-mono font-bold text-muted-foreground/60 tabular-nums">
                {formatTime(currentTimeMs)} / {formatTime(totalDurationMs)}
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-foreground">
                   <Link className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className={cn("h-7 w-7 transition-colors", selectedClipId ? "text-destructive" : "text-muted-foreground/40")} onClick={() => selectedClipId && removeItem.mutate({ storyId, itemId: selectedClipId })}>
                   <Trash className="h-3.5 w-3.5" />
                </Button>
             </div>
             
             <div className="flex items-center gap-3">
                <Minus className="h-3 w-3 text-muted-foreground/40 cursor-pointer hover:text-foreground" onClick={() => setPixelsPerSecond(p => Math.max(MIN_PIXELS_PER_SECOND, p / 1.5))} />
                <div className="w-24">
                   <Slider value={[pixelsPerSecond]} onValueChange={(v) => setPixelsPerSecond(v[0])} min={MIN_PIXELS_PER_SECOND} max={MAX_PIXELS_PER_SECOND} step={1} />
                </div>
                <Plus className="h-3 w-3 text-muted-foreground/40 cursor-pointer hover:text-foreground" onClick={() => setPixelsPerSecond(p => Math.min(MAX_PIXELS_PER_SECOND, p * 1.5))} />
             </div>
          </div>
       </div>

       {/* Track Area */}
       <div className="flex-1 flex min-h-0 relative">
          {/* Header Column (Track Numbers) */}
          <div className="w-14 shrink-0 flex flex-col pt-1 border-r border-white/[0.02] bg-[#0d0e0f]">
             {tracks.map((t) => (
               <div key={t} className="h-[44px] flex items-center justify-center text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest border-b border-white/[0.01]">
                 {t}
               </div>
             ))}
          </div>

          {/* Scrolling Tracks Container */}
          <div ref={tracksRef} className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar select-none" onClick={handleTimelineClick}>
             <div style={{ width: `${Math.max(msToPixels(totalDurationMs) + 400, 1000)}px`, height: '100%' }} className="relative">
                {/* Horizontal Guide Lines */}
                {tracks.map((_, i) => (
                  <div key={i} style={{ top: `${(i + 1) * TRACK_HEIGHT}px` }} className="absolute left-0 right-0 border-b border-white/[0.01] pointer-events-none" />
                ))}

                {/* Vertical Playhead */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                  style={{ left: `${msToPixels(currentTimeMs)}px` }}
                >
                   <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                </div>

                {/* Clips Grid */}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute rounded-lg border transition-all cursor-move flex flex-col overflow-hidden group',
                      selectedClipId === item.id ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-[#191a1b] border-white/10 hover:border-primary/40'
                    )}
                    style={getClipStyle(item)}
                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(item.id); }}
                    onMouseDown={(e) => handleDragStart(e, item)}
                  >
                     <div className="h-4 px-2 flex items-center justify-between bg-black/40">
                        <span className="text-[9px] font-bold text-muted-foreground group-hover:text-primary transition-colors truncate">{item.profile_name}</span>
                        <span className="text-[8px] opacity-20 font-mono">{item.language}</span>
                     </div>
                     <div className="flex-1 px-1 py-1">
                        <ClipWaveform 
                          generationId={item.generation_id} 
                          width={msToPixels(getEffectiveDuration(item))} 
                          trimStartMs={item.trim_start_ms || 0} 
                          trimEndMs={item.trim_end_ms || 0} 
                          duration={item.duration} 
                        />
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}
