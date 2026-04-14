import { Sparkles, Upload, Box, Mic2, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { FloatingGenerateBox } from '@/components/Generation/FloatingGenerateBox';
import { HistoryTable } from '@/components/History/HistoryTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ProfileList } from '@/components/VoiceProfiles/ProfileList';
import { BOTTOM_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import { useImportProfile } from '@/lib/hooks/useProfiles';
import { cn } from '@/lib/utils/cn';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { motion } from 'framer-motion';

export function MainEditor() {
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;
  const scrollRef = useRef<HTMLDivElement>(null);
  const setDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
  const importProfile = useImportProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.voicebox.zip')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a valid .voicebox.zip file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setImportDialogOpen(true);
    }
  };

  const handleImportConfirm = () => {
    if (selectedFile) {
      importProfile.mutate(selectedFile, {
        onSuccess: () => {
          setImportDialogOpen(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          toast({
            title: 'Profile imported',
            description: 'Voice profile imported successfully',
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to import profile',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <div className="flex gap-1 h-full min-h-0 overflow-hidden relative">
      {/* Left Column - Voice Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative p-6">
        <header className="flex items-center justify-between mb-8 px-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Voicebox</h1>
            
            <div className="flex gap-2">
               <Button variant="outline" size="xs" onClick={handleImportClick} className="rounded-lg h-8 border-white/5 bg-white/5 hover:bg-white/10 text-[11px] font-bold uppercase tracking-wider">
                 Import Voice
               </Button>
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".voicebox.zip"
                 onChange={handleFileChange}
                 className="hidden"
               />
               <Button onClick={() => setDialogOpen(true)} size="xs" variant="premium" className="rounded-lg h-8 shadow-[0_0_15px_rgba(234,179,8,0.2)] text-[11px] font-bold uppercase tracking-wider">
                 Create Voice
               </Button>
             </div>
        </header>

        <div
          ref={scrollRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto pb-4 custom-scrollbar px-2',
            isPlayerVisible && BOTTOM_SAFE_AREA_PADDING,
          )}
        >
          <ProfileList />
        </div>

        {/* Generate Box at bottom of left column */}
        <div className="mt-4 px-2">
           <FloatingGenerateBox isPlayerOpen={!!audioUrl} />
        </div>
      </div>

      {/* Right Column - History Section (Chat style) */}
      <div className="w-[420px] shrink-0 flex flex-col min-h-0 overflow-hidden bg-[#050505] border-l border-white/5 shadow-2xl">
        <HistoryTable />
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-[#191a1b] border-[#23252a]">
          <DialogHeader>
            <DialogTitle>Import Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Import the profile from "{selectedFile?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={importProfile.isPending || !selectedFile}
              variant="premium"
            >
              {importProfile.isPending ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
