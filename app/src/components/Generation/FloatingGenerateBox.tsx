import { useMatchRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, SlidersHorizontal, Sparkles, ChevronDown, Command } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { LANGUAGE_OPTIONS } from '@/lib/constants/languages';
import { useGenerationForm } from '@/lib/hooks/useGenerationForm';
import { useProfile, useProfiles } from '@/lib/hooks/useProfiles';
import { useAddStoryItem, useStory } from '@/lib/hooks/useStories';
import { cn } from '@/lib/utils/cn';
import { useStoryStore } from '@/stores/storyStore';
import { useUIStore } from '@/stores/uiStore';

export function FloatingGenerateBox({
  isPlayerOpen = false,
  showVoiceSelector = false,
}) {
  const selectedProfileId = useUIStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useUIStore((state) => state.setSelectedProfileId);
  const { data: profiles } = useProfiles();
  const { data: selectedProfile } = useProfile(selectedProfileId || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRoute = useMatchRoute();
  const isStoriesRoute = matchRoute({ to: '/stories' });
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const addStoryItem = useAddStoryItem();

  const { form, handleSubmit, isPending } = useGenerationForm({
    onSuccess: async (generationId) => {
      setIsExpanded(false);
      if (isStoriesRoute && selectedStoryId && generationId) {
        try {
          await addStoryItem.mutateAsync({
            storyId: selectedStoryId,
            data: { generation_id: generationId },
          });
        } catch (error) {
          console.error('Failed to add to story', error);
        }
      }
    },
  });

  useEffect(() => {
    if (!selectedProfileId && profiles && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [selectedProfileId, profiles, setSelectedProfileId]);

  async function onSubmit(data: Parameters<typeof handleSubmit>[0]) {
    await handleSubmit(data, selectedProfileId);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full bg-[#111111] border border-white/[0.04] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 relative',
        isExpanded && 'ring-1 ring-primary/20'
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
          <div className="relative">
             <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={selectedProfile ? `Generate speech using ${selectedProfile.name}...` : "Select a voice to generate speech..."}
                        className={cn(
                          "resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[15px] leading-relaxed placeholder:text-muted-foreground/30 transition-all font-medium",
                          isExpanded ? "min-h-[140px]" : "min-h-[22px]"
                        )}
                        onClick={() => setIsExpanded(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                          if (e.key === 'Escape') setIsExpanded(false);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Sparkles button on right mid-top */}
              <div className="absolute top-0 right-0">
                 <Button
                    type="submit"
                    disabled={isPending || !selectedProfileId}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-primary shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Sparkles className="h-5 w-5 text-primary-foreground" />}
                  </Button>
              </div>
          </div>

          {/* Bottom Bar Controls (Original Layout) */}
          <div className="flex items-center gap-3 pt-6 mt-2 border-t border-white/[0.02]">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-8 text-[11px] font-bold tracking-tight bg-white/[0.03] border-none hover:bg-white/[0.06] rounded-xl transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191a1b] border-white/5">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} className="text-xs">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelSize"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-8 text-[11px] font-bold tracking-tight bg-white/[0.03] border-none hover:bg-white/[0.06] rounded-xl transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#191a1b] border-white/5">
                        <SelectItem value="1.7B" className="text-xs">Qwen3-TTS 1.7B</SelectItem>
                        <SelectItem value="0.6B" className="text-xs">Qwen3-TTS 0.6B</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
          </div>
        </form>
      </Form>

      {/* Subtle indicator for keyboard shortcut */}
      {isExpanded && (
        <div className="pb-2 px-4 text-[9px] text-muted-foreground/20 font-bold uppercase tracking-widest text-right pointer-events-none">
           Command + Enter to Generate
        </div>
      )}
    </div>
  );
}
