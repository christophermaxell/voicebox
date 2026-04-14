import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Mic, MoreHorizontal, Play, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StoryItemDetail } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';
import { useServerStore } from '@/stores/serverStore';

interface StoryChatItemProps {
  item: StoryItemDetail;
  storyId: string;
  index: number;
  onRemove: () => void;
  currentTimeMs: number;
  isPlaying: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function StoryChatItem({
  item,
  onRemove,
  currentTimeMs,
  isPlaying,
  dragHandleProps,
  isDragging,
}: StoryChatItemProps) {
  const seek = useStoryStore((state) => state.seek);
  const serverUrl = useServerStore((state) => state.serverUrl);
  const [avatarError, setAvatarError] = useState(false);

  const avatarUrl = `${serverUrl}/profiles/${item.profile_id}/avatar`;

  const itemStartMs = item.start_time_ms;
  const itemEndMs = item.start_time_ms + item.duration * 1000;
  const isCurrentlyPlaying = isPlaying && currentTimeMs >= itemStartMs && currentTimeMs < itemEndMs;

  const handlePlay = () => {
    seek(itemStartMs);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-5 p-4 rounded-3xl transition-all duration-500 relative',
        isCurrentlyPlaying && 'bg-primary/[0.03] shadow-[0_0_30px_rgba(234,179,8,0.05)] border-l-2 border-primary',
        isDragging && 'opacity-50 scale-95 ring-2 ring-primary/20',
        !isCurrentlyPlaying && 'hover:bg-white/[0.02]'
      )}
    >
      {/* 1. Avatar Container */}
      <div className="shrink-0 relative">
        <div className={cn(
          "h-12 w-12 rounded-full bg-[#111111] border border-white/[0.08] flex items-center justify-center overflow-hidden transition-all duration-500",
          isCurrentlyPlaying && "border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-110"
        )}>
          {!avatarError ? (
            <img
              src={avatarUrl}
              alt={item.profile_name}
              className={cn(
                'h-full w-full object-cover transition-all duration-300',
                !isCurrentlyPlaying && 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
              )}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <Mic className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {isCurrentlyPlaying && (
           <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg ring-2 ring-black">
              <Play className="h-2 w-2 fill-current" />
           </div>
        )}
      </div>

      {/* 2. Content Column */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <header className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <span className={cn(
                "font-bold text-[14px] transition-colors",
                isCurrentlyPlaying ? "text-primary" : "text-foreground"
              )}>{item.profile_name}</span>
              <div className="text-[10px] font-bold bg-white/5 text-muted-foreground/60 px-2 py-0.5 rounded-lg border border-white/[0.04] uppercase tracking-wider">
                 {item.language}
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-[11px] font-mono font-bold text-muted-foreground/30 tabular-nums">
                 {formatTime(itemStartMs)}
              </div>
              
              {/* Context Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111111] border-white/10">
                  <DropdownMenuItem onClick={handlePlay}>
                    <Play className="mr-2 h-3.5 w-3.5" /> Play from here
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove from Story
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {dragHandleProps && (
                <button
                  type="button"
                  className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  {...dragHandleProps}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}
           </div>
        </header>

        <p className={cn(
          "text-[15px] leading-relaxed transition-all",
          isCurrentlyPlaying ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground/80"
        )}>
          {item.text}
        </p>
      </div>
    </div>
  );
}

export function SortableStoryChatItem(props: Omit<StoryChatItemProps, 'dragHandleProps' | 'isDragging'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.generation_id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <StoryChatItem {...props} dragHandleProps={listeners} isDragging={isDragging} />
    </div>
  );
}
