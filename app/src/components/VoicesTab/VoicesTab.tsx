import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, MoreHorizontal, Plus, Trash2, Mic, Mic2, BarChart3, Radio } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MultiSelect } from '@/components/ui/multi-select';
import { ProfileForm } from '@/components/VoiceProfiles/ProfileForm';
import { apiClient } from '@/lib/api/client';
import type { VoiceProfileResponse } from '@/lib/api/types';
import { BOTTOM_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import { useHistoryStats } from '@/lib/hooks/useHistory';
import { useDeleteProfile, useProfileSamples, useProfiles } from '@/lib/hooks/useProfiles';
import { cn } from '@/lib/utils/cn';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

export function VoicesTab() {
  const { data: profiles, isLoading } = useProfiles();
  const { data: statsData } = useHistoryStats();
  const queryClient = useQueryClient();
  const setDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
  const setEditingProfileId = useUIStore((state) => state.setEditingProfileId);
  const deleteProfile = useDeleteProfile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;

  const generationCounts = useMemo(() => {
    return statsData?.generations_by_profile || {};
  }, [statsData]);

  const { data: channelAssignments } = useQuery({
    queryKey: ['profile-channels'],
    queryFn: async () => {
      if (!profiles) return {};
      const assignments: Record<string, string[]> = {};
      for (const profile of profiles) {
        try {
          const result = await apiClient.getProfileChannels(profile.id);
          assignments[profile.id] = result.channel_ids;
        } catch {
          assignments[profile.id] = [];
        }
      }
      return assignments;
    },
    enabled: !!profiles,
  });

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: () => apiClient.listChannels(),
  });

  const handleEdit = (profileId: string) => {
    setEditingProfileId(profileId);
    setDialogOpen(true);
  };

  const handleDelete = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      deleteProfile.mutate(profileId);
    }
  };

  const handleChannelChange = async (profileId: string, channelIds: string[]) => {
    try {
      await apiClient.setProfileChannels(profileId, channelIds);
      queryClient.invalidateQueries({ queryKey: ['profile-channels'] });
    } catch (error) {
      console.error('Failed to update channels:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden p-8 pl-28">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -z-10 opacity-30 pointer-events-none" />

      <header className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             Voice Directory
          </h1>
          <p className="text-sm text-muted-foreground">Manage your voice clones and their output channels.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="premium" className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Voice
        </Button>
      </header>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3',
          isPlayerVisible && BOTTOM_SAFE_AREA_PADDING,
        )}
      >
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 mb-4">
           <div className="col-span-4">Voice</div>
           <div className="col-span-1">Lang</div>
           <div className="col-span-1">Activity</div>
           <div className="col-span-4">Output Channels</div>
           <div className="col-span-2 text-right">Actions</div>
        </div>

        <AnimatePresence mode="popLayout">
          {profiles?.map((profile) => (
            <VoiceRow
              key={profile.id}
              profile={profile}
              generationCount={generationCounts[profile.id] || 0}
              channelIds={channelAssignments?.[profile.id] || []}
              channels={channels || []}
              onChannelChange={(channelIds) => handleChannelChange(profile.id, channelIds)}
              onEdit={() => handleEdit(profile.id)}
              onDelete={() => handleDelete(profile.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <ProfileForm />
    </div>
  );
}

interface VoiceRowProps {
  profile: VoiceProfileResponse;
  generationCount: number;
  channelIds: string[];
  channels: Array<{ id: string; name: string; is_default: boolean }>;
  onChannelChange: (channelIds: string[]) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function VoiceRow({
  profile,
  generationCount,
  channelIds,
  channels,
  onChannelChange,
  onEdit,
  onDelete,
}: VoiceRowProps) {
  const { data: samples } = useProfileSamples(profile.id);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="grid grid-cols-12 gap-4 items-center p-4 bg-[#191a1b] border border-[#23252a] rounded-xl hover:bg-[#28282c] transition-all group cursor-pointer"
      onClick={onEdit}
    >
      <div className="col-span-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#0f1011] border border-[#23252a] flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
          <Mic2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{profile.name}</div>
          <div className="text-[10px] text-muted-foreground truncate opacity-60">
             {profile.description || 'System Voice'}
          </div>
        </div>
      </div>

      <div className="col-span-1">
         <span className="text-[10px] font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-muted-foreground">
            {profile.language.toUpperCase()}
         </span>
      </div>

      <div className="col-span-1 flex items-center gap-1.5">
         <BarChart3 className="h-3 w-3 text-primary/40" />
         <span className="text-xs font-medium">{generationCount}</span>
      </div>

      <div className="col-span-4" onClick={(e) => e.stopPropagation()}>
        <MultiSelect
          options={channels.map((ch) => ({
            value: ch.id,
            label: `${ch.name}${ch.is_default ? ' (D)' : ''}`,
          }))}
          value={channelIds}
          onChange={onChannelChange}
          placeholder="Routes..."
          className="bg-[#0f1011] border-[#23252a] h-8 text-[11px]"
        />
      </div>

      <div className="col-span-2 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 rounded-lg hover:bg-white/5">
           <Edit className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#191a1b] border-[#23252a]">
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-white focus:bg-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Voice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    className={className}
  >
     <Mic className="h-full w-full" />
  </motion.div>
);
