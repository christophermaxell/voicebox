import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Download, Plus, Upload, Sparkles, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useHistory } from '@/lib/hooks/useHistory';
import {
  useAddStoryItem,
  useExportStoryAudio,
  useRemoveStoryItem,
  useReorderStoryItems,
  useStory,
} from '@/lib/hooks/useStories';
import { useStoryPlayback } from '@/lib/hooks/useStoryPlayback';
import { useStoryStore } from '@/stores/storyStore';
import { SortableStoryChatItem } from './StoryChatItem';
import { FloatingGenerateBox } from '@/components/Generation/FloatingGenerateBox';
import { cn } from '@/lib/utils/cn';

export function StoryContent() {
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const { data: story, isLoading } = useStory(selectedStoryId);
  const removeItem = useRemoveStoryItem();
  const reorderItems = useReorderStoryItems();
  const exportAudio = useExportStoryAudio();
  const addStoryItem = useAddStoryItem();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: historyData } = useHistory();

  const availableGenerations = useMemo(() => {
    if (!historyData?.items || !story) return [];
    const storyGenerationIds = new Set(story.items.map((i) => i.generation_id));
    const query = searchQuery.toLowerCase();
    return historyData.items.filter(
      (gen) =>
        !storyGenerationIds.has(gen.id) &&
        (gen.text.toLowerCase().includes(query) ||
          gen.profile_name.toLowerCase().includes(query)),
    );
  }, [historyData, story, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isPlaying = useStoryStore((state) => state.isPlaying);
  const currentTimeMs = useStoryStore((state) => state.currentTimeMs);
  const playbackStoryId = useStoryStore((state) => state.playbackStoryId);

  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledItemRef = useRef<string | null>(null);

  useStoryPlayback(story?.items);

  const sortedItems = useMemo(() => {
    if (!story?.items) return [];
    return [...story.items].sort((a, b) => a.start_time_ms - b.start_time_ms);
  }, [story?.items]);

  const currentlyPlayingItemId = useMemo(() => {
    if (!isPlaying || playbackStoryId !== story?.id || !sortedItems.length) return null;
    const playingItem = sortedItems.find((item) => {
      const itemStart = item.start_time_ms;
      const itemEnd = item.start_time_ms + item.duration * 1000;
      return currentTimeMs >= itemStart && currentTimeMs < itemEnd;
    });
    return playingItem?.generation_id ?? null;
  }, [isPlaying, playbackStoryId, story?.id, sortedItems, currentTimeMs]);

  useEffect(() => {
    if (!currentlyPlayingItemId || currentlyPlayingItemId === lastScrolledItemRef.current) return;
    const element = itemRefsMap.current.get(currentlyPlayingItemId);
    if (element && scrollRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      lastScrolledItemRef.current = currentlyPlayingItemId;
    }
  }, [currentlyPlayingItemId]);

  const handleRemoveItem = (itemId: string) => {
    if (!story) return;
    removeItem.mutate({ storyId: story.id, itemId });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!story || !over || active.id === over.id) return;
    const oldIndex = sortedItems.findIndex((item) => item.generation_id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.generation_id === over.id);
    const newOrder = arrayMove(sortedItems, oldIndex, newIndex);
    const generationIds = newOrder.map((item) => item.generation_id);
    reorderItems.mutate({ storyId: story.id, data: { generation_ids: generationIds } });
  };

  const handleExportAudio = () => {
    if (!story) return;
    exportAudio.mutate({ storyId: story.id, storyName: story.name });
  };

  const handleAddGeneration = (generationId: string) => {
    if (!story) return;
    addStoryItem.mutate({ storyId: story.id, data: { generation_id: generationId } }, {
      onSuccess: () => { setIsAddOpen(false); setSearchQuery(''); }
    });
  };

  if (!selectedStoryId) return <div className="flex items-center justify-center h-full text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-20">Select a project to begin.</div>;
  if (isLoading || !story) return <div className="p-8 text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-[10px]">Syncing Content...</div>;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0a0a0a]">
      {/* Header Panel */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/[0.04] bg-[#0d0d0e]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{story.name}</h2>
          <p className="text-xs text-muted-foreground/60">{story.description || 'Active multi-voice synthesis session.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-all">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Clip
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2 bg-[#111111] border-white/10" align="end">
              <Input placeholder="Search generation history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/40 border-white/5 text-sm" />
              <div className="mt-2 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                {availableGenerations.map((gen) => (
                  <button key={gen.id} className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group" onClick={() => handleAddGeneration(gen.id)}>
                    <div className="font-bold text-xs group-hover:text-primary transition-colors">{gen.profile_name}</div>
                    <div className="text-[10px] text-muted-foreground truncate opacity-40">{gen.text}</div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={handleExportAudio} disabled={exportAudio.isPending || story.items.length === 0} className="h-8 rounded-lg border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export Project
          </Button>
        </div>
      </header>

      {/* Item Feed (Chat Style) */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 space-y-12"
      >
        {sortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 text-[10px] font-bold uppercase tracking-[0.2em] border border-dashed border-white/5 rounded-3xl mx-4">
            Project is empty. Initialize dialogue below.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedItems.map((item) => item.generation_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-10">
                {sortedItems.map((item, index) => (
                  <div key={item.id} ref={(el) => { if (el) itemRefsMap.current.set(item.generation_id, el); else itemRefsMap.current.delete(item.generation_id); }}>
                    <SortableStoryChatItem
                      item={item}
                      storyId={story.id}
                      index={index}
                      onRemove={() => handleRemoveItem(item.id)}
                      currentTimeMs={currentTimeMs}
                      isPlaying={isPlaying && playbackStoryId === story.id}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Synthesis Box - Anchored at bottom of chat column */}
      <div className="p-8 pt-0">
          <FloatingGenerateBox showVoiceSelector />
      </div>
    </div>
  );
}
