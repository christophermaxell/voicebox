import { Download, Edit, Mic, Trash2, Globe2, Activity } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { VoiceProfileResponse } from '@/lib/api/types';
import { useDeleteProfile, useExportProfile } from '@/lib/hooks/useProfiles';
import { cn } from '@/lib/utils/cn';
import { useServerStore } from '@/stores/serverStore';
import { useUIStore } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCardProps {
  profile: VoiceProfileResponse;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const deleteProfile = useDeleteProfile();
  const exportProfile = useExportProfile();
  const setEditingProfileId = useUIStore((state) => state.setEditingProfileId);
  const setProfileDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
  const selectedProfileId = useUIStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useUIStore((state) => state.setSelectedProfileId);
  const serverUrl = useServerStore((state) => state.serverUrl);

  const isSelected = selectedProfileId === profile.id;

  const avatarUrl = profile.avatar_path ? `${serverUrl}/profiles/${profile.id}/avatar` : null;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProfileId(isSelected ? null : profile.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfileId(profile.id);
    setProfileDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteProfile.mutate(profile.id);
    setDeleteDialogOpen(false);
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportProfile.mutate(profile.id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'relative p-4 rounded-2xl transition-all duration-300 cursor-pointer group',
          'bg-[#111111] border border-white/5 hover:border-primary/40',
          isSelected && 'ring-2 ring-primary/60 border-primary/40'
        )}
        onClick={handleSelect}
      >
        <div className="flex gap-4 h-full relative z-10">
          {/* Avatar Container */}
          <div className="h-16 w-16 rounded-2xl bg-[#0a0a0a] border border-white/5 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-primary/50 transition-colors">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className={cn(
                  'h-full w-full object-cover rounded-xl transition-all duration-500',
                  !isSelected && 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                )}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <Mic className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base text-foreground truncate">{profile.name}</span>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
               <div className="flex items-center gap-1">
                  <Globe2 className="h-2.5 w-2.5" />
                  {profile.language}
               </div>
               <div className="flex items-center gap-1">
                  <Activity className="h-2.5 w-2.5" />
                  IDLE
               </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1 opacity-40 group-hover:opacity-100 transition-opacity">
              {profile.description || 'Voicebox Synthesis Studio'}
            </p>
          </div>

          {/* Quick Actions overlay on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-white/10" onClick={handleEdit}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive" onClick={handleDeleteClick}>
                <Trash2 className="h-3 w-3" />
              </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Voice</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{profile.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
