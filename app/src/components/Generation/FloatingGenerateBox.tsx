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

interface FloatingGenerateBoxProps {
  isPlayerOpen?: boolean;
  showVoiceSelector?: boolean;
}

export function FloatingGenerateBox({
  isPlayerOpen = false,
  showVoiceSelector = false,
}: FloatingGenerateBoxProps) {
  const selectedProfileId = useUIStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useUIStore((state) => state.setSelectedProfileId);
  const { data: selectedProfile } = useProfile(selectedProfileId || '');
  const { data: profiles } = useProfiles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstructMode, setIsInstructMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const matchRoute = useMatchRoute();
  const isStoriesRoute = matchRoute({ to: '/stories' });
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const trackEditorHeight = useStoryStore((state) => state.trackEditorHeight);
  const { data: currentStory } = useStory(selectedStoryId);
  const addStoryItem = useAddStoryItem();
  const { toast } = useToast();

  const hasTrackEditor = isStoriesRoute && currentStory && currentStory.items.length > 0;

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
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as HTMLElement)) return;
      if ((event.target as HTMLElement).closest('[role="listbox"]') || (event.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) return;
      setIsExpanded(false);
    }
    if (isExpanded) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  useEffect(() => {
    if (!selectedProfileId && profiles && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [selectedProfileId, profiles, setSelectedProfileId]);

  async function onSubmit(data: Parameters<typeof handleSubmit>[0]) {
    await handleSubmit(data, selectedProfileId);
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'fixed z-[100] transition-all duration-500',
        isStoriesRoute
          ? 'left-[calc(5rem+2rem)] w-[360px]'
          : 'left-[calc(5rem+2rem)] w-[calc((100%-5rem-4rem)/2-1rem)]',
      )}
      style={{
        bottom: hasTrackEditor
          ? `${trackEditorHeight + 24}px`
          : isPlayerOpen
            ? 'calc(7rem + 1.5rem)'
            : '1.5rem',
      }}
    >
      <motion.div
        layout
        className="bg-[#191a1b] border border-[#23252a] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Header / Mode Indicator */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary tracking-tighter uppercase p-1">
                   {isInstructMode ? <SlidersHorizontal className="h-3 w-3" /> : <Command className="h-3 w-3" />}
                   {isInstructMode ? 'Instruction Mode' : 'Speech Text'}
                </div>
                <div className="flex items-center gap-2">
                   {isExpanded && (
                       <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          <kbd className="opacity-70">ESC</kbd> to close
                       </div>
                   )}
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn("h-6 w-6 rounded-md transition-colors", isInstructMode ? "text-primary bg-primary/10" : "text-muted-foreground")}
                      onClick={() => setIsInstructMode(!isInstructMode)}
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                  </Button>
                </div>
            </div>

            <div className="p-3">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isInstructMode ? 'instruct' : 'text'}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name={isInstructMode ? "instruct" : "text"}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={
                                isInstructMode 
                                  ? "Describe the emotion, e.g., 'very happy and energetic'..." 
                                  : "Type or paste the text you want to synthesize..."
                              }
                              className={cn(
                                "resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-sm leading-relaxed placeholder:text-muted-foreground/30 transition-all min-h-[40px]",
                                isExpanded ? "min-h-[140px]" : "min-h-[40px]"
                              )}
                              onClick={() => setIsExpanded(true)}
                              onFocus={() => setIsExpanded(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  form.handleSubmit(onSubmit)();
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* Submit Trigger - Integrated into the corner when expanded */}
                <div className="absolute bottom-0 right-0 p-1">
                   <Button
                    type="submit"
                    disabled={isPending || !selectedProfileId}
                    size={isExpanded ? "default" : "icon"}
                    className={cn(
                      "transition-all duration-300 shadow-xl",
                      isExpanded ? "px-4 rounded-lg bg-primary" : "h-8 w-8 rounded-lg bg-primary"
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className={cn("h-3.5 w-3.5", isExpanded && "mr-2")} />
                        {isExpanded && "Generate"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Advanced Controls Area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-white/5"
                  >
                    <div className="flex gap-2">
                      {showVoiceSelector && (
                        <div className="flex-1">
                          <Select
                            value={selectedProfileId || ''}
                            onValueChange={(value) => setSelectedProfileId(value || null)}
                          >
                            <SelectTrigger className="h-9 text-[11px] bg-[#0f1011] border-[#23252a] rounded-lg">
                               <div className="flex items-center gap-2 truncate">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(94,106,210,0.8)]" />
                                  <SelectValue placeholder="Voice" />
                               </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#191a1b] border-[#23252a]">
                              {profiles?.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id} className="text-xs">
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="h-9 text-[11px] bg-[#0f1011] border-[#23252a] rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#191a1b] border-[#23252a]">
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
                              <SelectTrigger className="h-9 text-[11px] bg-[#0f1011] border-[#23252a] rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#191a1b] border-[#23252a]">
                                <SelectItem value="1.7B" className="text-xs">Base 1.7B</SelectItem>
                                <SelectItem value="0.6B" className="text-xs">Fast 0.6B</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
}
