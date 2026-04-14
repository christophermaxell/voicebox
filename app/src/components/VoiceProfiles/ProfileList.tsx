import { useProfiles } from '@/lib/hooks/useProfiles';
import { ProfileCard } from './ProfileCard';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfileList() {
  const { data: profiles, isLoading } = useProfiles();
  const setDialogOpen = useUIStore((state) => state.setProfileDialogOpen);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-sm text-muted-foreground animate-pulse">Syncing voice profiles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {profiles && profiles.length > 0 ? (
        <motion.div 
           initial="hidden"
           animate="visible"
           variants={{
             visible: { transition: { staggerChildren: 0.1 } }
           }}
           className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 px-8 border border-dashed border-border rounded-2xl bg-white/5 text-center gap-6"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
             <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No voice profiles found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create your first AI voice clone by recording or uploading audio samples.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} variant="premium">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Voice
          </Button>
        </motion.div>
      )}
    </div>
  );
}
