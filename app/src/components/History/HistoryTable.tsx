import {
  AudioWaveform,
  Download,
  FileArchive,
  Loader2,
  MoreHorizontal,
  Play,
  Trash2,
  Clock,
  History,
  MessageSquare,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import type { HistoryResponse } from '@/lib/api/types';
import { BOTTOM_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import {
  useDeleteGeneration,
  useExportGeneration,
  useExportGenerationAudio,
  useHistory,
} from '@/lib/hooks/useHistory';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatDuration } from '@/lib/utils/format';
import { usePlayerStore } from '@/stores/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

export function HistoryTable() {
  const [page, setPage] = useState(0);
  const [allHistory, setAllHistory] = useState<HistoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const hasMore = allHistory.length < total;
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generationToDelete, setGenerationToDelete] = useState<{ id: string; name: string } | null>(null);
  const limit = 20;
  const { toast } = useToast();

  const {
    data: historyData,
    isLoading,
    isFetching,
  } = useHistory({
    limit,
    offset: page * limit,
  });

  const deleteGeneration = useDeleteGeneration();
  const exportGeneration = useExportGeneration();
  const exportGenerationAudio = useExportGenerationAudio();
  const setAudioWithAutoPlay = usePlayerStore((state) => state.setAudioWithAutoPlay);
  const restartCurrentAudio = usePlayerStore((state) => state.restartCurrentAudio);
  const currentAudioId = usePlayerStore((state) => state.audioId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;

  useEffect(() => {
    if (historyData?.items) {
      setTotal(historyData.total);
      if (page === 0) {
        setAllHistory(historyData.items);
      } else {
        setAllHistory((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = historyData.items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [historyData, page]);

  useEffect(() => {
    if (deleteGeneration.isSuccess) {
      setPage(0);
      setAllHistory([]);
    }
  }, [deleteGeneration.isSuccess]);

  useEffect(() => {
    const loadMoreEl = loadMoreRef.current;
    if (!loadMoreEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isFetching && allHistory.length < total) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreEl);
    return () => observer.disconnect();
  }, [isFetching, allHistory.length, total]);

  const handlePlay = (audioId: string, text: string, profileId: string) => {
    if (currentAudioId === audioId) {
      restartCurrentAudio();
    } else {
      const audioUrl = apiClient.getAudioUrl(audioId);
      setAudioWithAutoPlay(audioUrl, audioId, profileId, text.substring(0, 50));
    }
  };

  const handleDownloadAudio = (generationId: string, text: string) => {
    exportGenerationAudio.mutate({ generationId, text }, {
      onError: (error) => {
        toast({ title: 'Failed to download audio', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (generationToDelete) {
      deleteGeneration.mutate(generationToDelete.id);
      setDeleteDialogOpen(false);
      setGenerationToDelete(null);
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 relative p-6">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
           <History className="h-3.5 w-3.5" />
           Project History
        </div>
        <div className="text-[10px] text-primary/60 font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
           {total} Items
        </div>
      </header>

      {allHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 text-xs gap-4 border border-dashed border-white/5 rounded-2xl">
          <MessageSquare className="h-10 w-10 opacity-10" />
          No activity recorded yet.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto space-y-4 pb-8 pr-2 custom-scrollbar',
            isPlayerVisible && BOTTOM_SAFE_AREA_PADDING,
          )}
        >
          <AnimatePresence mode="popLayout">
            {allHistory.map((gen) => {
              const isCurrentlyPlaying = currentAudioId === gen.id && isPlaying;
              return (
                <motion.div
                  key={gen.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    'group flex flex-col gap-3 p-4 bg-[#0a0a0a]/60 border border-white/5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer relative',
                    isCurrentlyPlaying && 'border-primary/40 bg-primary/5 shadow-premium'
                  )}
                  onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}
                >
                   {/* Play Indicator overlay */}
                   {isCurrentlyPlaying && (
                     <div className="absolute top-2 right-2">
                        <div className="flex gap-0.5 items-end h-3">
                           <div className="w-1 bg-primary rounded-full animate-bounce h-full" style={{ animationDelay: '0s' }} />
                           <div className="w-1 bg-primary rounded-full animate-bounce h-2/3" style={{ animationDelay: '0.1s' }} />
                           <div className="w-1 bg-primary rounded-full animate-bounce h-full" style={{ animationDelay: '0.2s' }} />
                        </div>
                     </div>
                   )}

                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                        isCurrentlyPlaying ? "bg-primary text-primary-foreground shadow-glow" : "bg-white/5 text-muted-foreground group-hover:text-primary"
                      )}>
                        {isCurrentlyPlaying ? <Play className="h-4 w-4 fill-current" /> : <AudioWaveform className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-foreground truncate">{gen.profile_name}</div>
                         <div className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">{formatDate(gen.created_at)}</div>
                      </div>
                   </div>
                   
                   <p className={cn(
                     "text-[13px] leading-relaxed transition-colors pr-4",
                     isCurrentlyPlaying ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
                   )}>
                     {gen.text}
                   </p>

                   <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-4">
                         <div className="text-[10px] font-bold text-muted-foreground/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(gen.duration)}
                         </div>
                         <div className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{gen.language}</div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 h-6">
                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-white/10" onClick={(e) => { e.stopPropagation(); handleDownloadAudio(gen.id, gen.text); }}>
                           <Download className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setGenerationToDelete({ id: gen.id, name: gen.profile_name }); setDeleteDialogOpen(true); }}>
                           <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                   </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
            </div>
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Generation</DialogTitle>
            <DialogDescription>
              This recorded synthesis will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
