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
  const { data: profiles } = useProfiles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstructMode, setIsInstructMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRoute = useMatchRoute();
  const isStoriesRoute = matchRoute({ to: '/stories' });
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const { data: currentStory } = useStory(selectedStoryId);
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
        'w-full bg-[#111111] border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
        isExpanded && 'ring-1 ring-primary/20'
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/2 border-b border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                 {isInstructMode ? <SlidersHorizontal className="h-3 w-3" /> : <Command className="h-3 w-3" />}
                 {isInstructMode ? 'Prompt' : 'Synthesis'}
              </div>
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6 rounded-md", isInstructMode ? "text-primary bg-primary/10" : "text-muted-foreground")}
                  onClick={() => setIsInstructMode(!isInstructMode)}
                >
                  <SlidersHorizontal className="h-3 w-3" />
              </Button>
          </div>

          <div className="p-4">
             <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isInstructMode ? 'instruct' : 'text'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
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
                                  ? "Describe the emotion..." 
                                  : "Type the text to generate..."
                              }
                              className={cn(
                                "resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm leading-relaxed placeholder:text-muted-foreground/20 transition-all",
                                isExpanded ? "min-h-[100px]" : "min-h-[20px]"
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
                  </motion.div>
                </AnimatePresence>

                {/* Inline Controls Toggle (visible when expanded) */}
                <AnimatePresence>
                   {isExpanded && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex gap-2 pt-4 border-t border-white/5 mt-4"
                     >
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-8 text-[10px] uppercase font-bold tracking-widest bg-white/5 border-white/5 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-white/10">
                                  {LANGUAGE_OPTIONS.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value} className="text-[10px]">
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
                                <SelectTrigger className="h-8 text-[10px] uppercase font-bold tracking-widest bg-white/5 border-white/5 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111111] border-white/10">
                                  <SelectItem value="1.7B" className="text-[10px]">Prime 1.7B</SelectItem>
                                  <SelectItem value="0.6B" className="text-[10px]">Fast 0.6B</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>

          <div className="px-4 pb-4 flex justify-between items-center transition-all">
             <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                {isPending ? 'Processing...' : (isExpanded ? 'CTRL+ENTER to generate' : '')}
             </div>
             <Button
                type="submit"
                disabled={isPending || !selectedProfileId}
                size="sm"
                className="h-8 rounded-lg bg-primary shadow-[0_0_15px_rgba(234,179,8,0.3)] px-6"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Generate</span>
                  </>
                )}
              </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
