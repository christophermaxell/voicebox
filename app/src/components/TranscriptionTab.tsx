import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Play, Pause, Download, Trash2, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { MainEditor } from '@/components/MainEditor/MainEditor';
import { useTranscription } from '@/lib/hooks/useTranscription';
import { LANGUAGE_OPTIONS } from '@/lib/constants/languages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';

export function TranscriptionTab() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('en');
  const [transcription, setTranscription] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const transcribe = useTranscription();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    try {
      const result = await transcribe.mutateAsync({ 
        file, 
        language: language as any 
      });
      setTranscription(result.text);
      toast({
        title: 'Transcription Complete',
        description: 'Whisper has successfully processed your audio.',
      });
    } catch (error) {
      toast({
        title: 'Transcription Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const clear = () => {
    setFile(null);
    setTranscription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTranscription = () => {
    const element = document.createElement('a');
    const fileContent = new Blob([transcription], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileContent);
    element.download = `${file?.name || 'transcription'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <MainEditor 
      title="Whisper Transcription" 
      description="Leverage OpenAI's Whisper model for high-fidelity speech-to-text conversion."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-6">
          <div 
            className={cn(
                "relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center text-center",
                file ? "border-primary/40 bg-primary/5" : "border-white/5 bg-white/2 hover:border-white/10"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) setFile(droppedFile);
            }}
          >
            {/* Animated Glow when file is present */}
            {file && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}

            <div className="relative z-10">
              <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500",
                  file ? "bg-primary text-white shadow-[0_0_30px_rgba(94,106,210,0.4)] scale-110" : "bg-white/5 text-muted-foreground"
              )}>
                {file ? <FileText className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
              </div>

              {file ? (
                <div>
                   <h3 className="text-lg font-semibold text-foreground mb-1">{file.name}</h3>
                   <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Upload Audio</h3>
                  <p className="text-sm text-muted-foreground max-w-[240px] mx-auto mb-6">
                    Drag and drop your audio or video file here, or click to browse.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="rounded-xl">
                    Select File
                  </Button>
                </>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="audio/*,video/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-[#191a1b] border border-[#23252a]">
             <div className="flex-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Source Language</label>
                <Select value={language} onValueChange={setLanguage}>
                   <SelectTrigger className="h-10 bg-[#0f1011] border-[#23252a] rounded-xl">
                      <div className="flex items-center gap-2">
                         <Globe2 className="h-3.5 w-3.5 text-primary" />
                         <SelectValue />
                      </div>
                   </SelectTrigger>
                   <SelectContent className="bg-[#191a1b] border-[#23252a]">
                      {LANGUAGE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
          </div>

          <div className="flex gap-3 mt-auto pt-6 border-t border-white/5">
             <Button 
                onClick={handleTranscribe} 
                className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20"
                disabled={!file || transcribe.isPending}
             >
                {transcribe.isPending ? (
                   <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Whisper is working...
                   </>
                ) : (
                   <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Transcription
                   </>
                )}
             </Button>
             {file && (
               <Button onClick={clear} variant="ghost" className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
               </Button>
             )}
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col min-h-0 bg-[#0f1011] rounded-3xl border border-[#23252a] overflow-hidden">
           <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output Text</span>
              </div>
              {transcription && (
                <Button onClick={downloadTranscription} variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs">
                   <Download className="h-3.5 w-3.5" />
                   Download TXT
                </Button>
              )}
           </div>
           
           <div className="flex-1 p-8 overflow-y-auto">
              {transcription ? (
                <div className="prose prose-invert max-w-none">
                   <p className="text-foreground/80 leading-relaxed font-sans text-lg whitespace-pre-wrap">
                      {transcription}
                   </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                   <FileText className="h-16 w-16 mb-4" />
                   <p className="text-sm font-medium">No transcription generated yet.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </MainEditor>
  );
}

// Sparkles icon not imported, let's add it
import { Sparkles } from 'lucide-react';
