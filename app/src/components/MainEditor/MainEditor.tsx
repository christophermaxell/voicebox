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
    <div className="flex gap-10 h-full min-h-0 overflow-hidden relative p-8 pl-28">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -z-10 opacity-30 pointer-events-none" />
      
      {/* Left Column - Voice Section */}
      <div className="flex-[1.2] flex flex-col min-h-0 overflow-hidden relative">
        <header className="flex items-center justify-between mb-8">
           <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                 Studio
                 <div className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider">PRO</div>
              </h1>
              <p className="text-sm text-muted-foreground">Select a voice and start generating.</p>
           </div>
           
           <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImportClick} className="rounded-xl">
                <Upload className="mr-2 h-3.5 w-3.5" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".voicebox.zip"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={() => setDialogOpen(true)} size="sm" variant="premium" className="rounded-xl">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                New Voice
              </Button>
            </div>
        </header>

        <div
          ref={scrollRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto pb-4 custom-scrollbar pr-4',
            isPlayerVisible && BOTTOM_SAFE_AREA_PADDING,
          )}
        >
          <ProfileList />
        </div>
      </div>

      {/* Right Column - History Section (Slightly narrower, more like a panel) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0f1011] border border-[#23252a] rounded-3xl p-6 shadow-highlight">
        <HistoryTable />
      </div>

      {/* Floating Generate Box */}
      <FloatingGenerateBox isPlayerOpen={!!audioUrl} />

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
