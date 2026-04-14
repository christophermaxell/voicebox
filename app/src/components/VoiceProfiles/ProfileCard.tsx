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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'relative p-4 rounded-xl transition-all duration-300 cursor-pointer group flex flex-col',
          'bg-[#191a1b] border border-white/[0.04] hover:bg-[#1e1e20] hover:border-white/[0.08]',
          isSelected && 'ring-2 ring-primary bg-[#1e1e20] border-transparent'
        )}
        onClick={handleSelect}
      >
        <div className="flex gap-4 items-start mb-4">
           {/* Avatar on left */}
           <div className="h-10 w-10 rounded-lg bg-[#0a0a0a] border border-white/5 p-0.5 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-primary/50 transition-colors">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className={cn(
                  'h-full w-full object-cover rounded-md transition-all duration-500',
                  !isSelected && 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                )}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>

          <div className="flex-1 min-w-0">
             <div className="text-[15px] font-bold text-foreground leading-none mb-1 truncate">{profile.name}</div>
             <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-[32px] opacity-40 group-hover:opacity-100 transition-opacity">
               {profile.description || 'No description provided for this AI voice.'}
             </p>
          </div>
        </div>

        {/* Bottom Metadata & Actions (The Original Design) */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.02]">
           <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground/60 tracking-widest uppercase">
              {profile.language}
           </div>

           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1 px-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleExport}
                title="Download Model"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button 
                className="p-1 px-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleEdit}
                title="Edit Voice"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button 
                className="p-1 px-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleDeleteClick}
                title="Delete Voice"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
