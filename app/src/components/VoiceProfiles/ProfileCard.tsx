import { Download, Edit, Mic, Trash2, Globe2 } from 'lucide-react';
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

  const handleSelect = () => {
    setSelectedProfileId(isSelected ? null : profile.id);
  };

  const handleEdit = () => {
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={cn(
          'relative p-4 rounded-xl transition-all duration-300 cursor-pointer group',
          'bg-[#191a1b] border border-[#23252a] hover:border-primary/40',
          'shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(94,106,210,0.15)]',
          isSelected && 'ring-1 ring-primary/60 border-primary/40 bg-primary/5'
        )}
        onClick={handleSelect}
      >
        {/* Active Glow / Border effect */}
        {isSelected && (
           <motion.div 
             layoutId={`border-${profile.id}`}
             className="absolute inset-0 rounded-xl border border-primary/50 pointer-events-none"
             transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
           />
        )}

        <div className="flex items-start gap-4 h-full relative z-10">
          {/* Avatar / Icon Container */}
          <div className="relative">
             <div className="h-14 w-14 rounded-xl bg-[#0f1011] border border-[#23252a] p-0.5 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-primary/50 transition-colors">
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={`${profile.name} avatar`}
                    className={cn(
                      'h-full w-full object-cover rounded-[10px] transition-all duration-500',
                      !isSelected && 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                    )}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Mic className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground truncate text-sm">
                  {profile.name}
                </h3>
             </div>
             
             <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 h-8">
               {profile.description || 'No description provided for this voice.'}
             </p>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-wider">
                   <Globe2 className="h-2.5 w-2.5" />
                   {profile.language}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-primary/20 hover:text-primary"
                      onClick={handleExport}
                      disabled={exportProfile.isPending}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                      onClick={handleDeleteClick}
                      disabled={deleteProfile.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#191a1b] border-[#23252a] text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete "{profile.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProfile.isPending}
            >
              {deleteProfile.isPending ? 'Deleting...' : 'Delete Voice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
