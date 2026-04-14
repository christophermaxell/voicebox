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
    <div className="flex flex-col h-full min-h-0 bg-[#0a0a0a]">
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 min-h-0 overflow-y-auto space-y-1 py-4 custom-scrollbar',
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'group flex items-center gap-4 px-6 py-4 bg-[#111111] border-y border-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer relative',
                  isCurrentlyPlaying && 'bg-primary/[0.03] border-y-primary/20'
                )}
                onClick={() => handlePlay(gen.id, gen.text, gen.profile_id)}
              >
                {/* Horizontal item: Icon | Info | Text snippet | Menu */}
                
                {/* 1. Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                   isCurrentlyPlaying ? "text-primary" : "text-muted-foreground/40 group-hover:text-primary/60"
                )}>
                   <AudioWaveform className="h-6 w-6" />
                </div>

                {/* 2. Info (Name, Lang, Time) */}
                <div className="w-32 shrink-0 flex flex-col gap-0.5 min-w-0">
                   <div className="text-[14px] font-bold text-foreground truncate">{gen.profile_name}</div>
                   <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 uppercase font-bold tracking-tighter">
                      <span>{gen.language}</span>
                      <span>{formatDuration(gen.duration)}</span>
                   </div>
                   <div className="text-[10px] text-muted-foreground/30 uppercase tracking-widest">{formatDate(gen.created_at)}</div>
                </div>

                {/* 3. Text snippet (The Main content) */}
                <div className="flex-1 min-w-0">
                   <p className="text-[13px] text-muted-foreground/80 group-hover:text-foreground/90 transition-colors line-clamp-2 leading-relaxed h-[40px] flex items-center">
                     {gen.text}
                   </p>
                </div>

                {/* 4. Menu */}
                <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#191a1b] border-[#23252a]">
                        <DropdownMenuItem onClick={() => handleDownloadAudio(gen.id, gen.text)}>
                          <Download className="mr-2 h-4 w-4" /> Export Audio
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                             setGenerationToDelete({ id: gen.id, name: gen.profile_name });
                             setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Generation</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this project?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
