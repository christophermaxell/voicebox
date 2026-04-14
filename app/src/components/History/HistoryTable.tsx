import {
  AudioWaveform,
  Download,
  FileArchive,
  Loader2,
  MoreHorizontal,
  Play,
  Trash2,
  Clock,
  ChevronRight,
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

  const handleExportPackage = (generationId: string, text: string) => {
    exportGeneration.mutate({ generationId, text }, {
      onError: (error) => {
        toast({ title: 'Failed to export generation', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleDeleteClick = (generationId: string, profileName: string) => {
    setGenerationToDelete({ id: generationId, name: profileName });
    setDeleteDialogOpen(true);
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
    <div className="flex flex-col h-full min-h-0 relative">
      <div className="flex items-center justify-between mb-4 mt-1 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
           <Clock className="h-3.5 w-3.5" />
           History
        </h2>
        <div className="text-[10px] text-muted-foreground bg-white/5 border border-white/5 rounded-full px-2 py-0.5">
           {total} GENERATIONS
        </div>
      </div>

      {allHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-white/5 text-muted-foreground text-sm gap-3">
          <AudioWaveform className="h-8 w-8 opacity-20" />
          No history yet. Start generating speech!
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto space-y-2 pb-8 px-0.5',
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    'group flex items-start gap-3 p-3 bg-[#191a1b] border border-[#23252a] rounded-xl hover:bg-[#28282c] transition-all cursor-pointer',
                    isCurrentlyPlaying && 'border-primary/50 shadow-[0_0_15px_rgba(94,106,210,0.1)]'
                  )}
                  onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isCurrentlyPlaying ? "bg-primary text-white" : "bg-[#0f1011] text-muted-foreground group-hover:text-primary"
                  )}>
                    {isCurrentlyPlaying ? <Play className="h-4 w-4 fill-current" /> : <AudioWaveform className="h-4 w-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-[13px] font-medium text-foreground">{gen.profile_name}</span>
                       <span className="text-[10px] text-muted-foreground">{formatDate(gen.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed pr-2 italic">
                      "{gen.text}"
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                       <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDuration(gen.duration)}
                       </div>
                       <div className="text-[10px] uppercase font-bold text-primary/60 tracking-tighter">
                          {gen.language}
                       </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#191a1b] border-[#23252a]">
                        <DropdownMenuItem onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}>
                          <Play className="mr-2 h-4 w-4" /> Play
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadAudio(gen.id, gen.text)}>
                          <Download className="mr-2 h-4 w-4" /> Export Audio
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportPackage(gen.id, gen.text)}>
                          <FileArchive className="mr-2 h-4 w-4" /> Export Package
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(gen.id, gen.profile_name)}
                          className="text-destructive focus:text-white focus:bg-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <DialogContent className="bg-[#191a1b] border-[#23252a]">
          <DialogHeader>
            <DialogTitle>Delete Generation</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Remove this generation from "{generationToDelete?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteGeneration.isPending}>
              {deleteGeneration.isPending ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
