import { Plus, BookOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useStories, useCreateStory, useUpdateStory, useDeleteStory } from '@/lib/hooks/useStories';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { useStoryStore } from '@/stores/storyStore';
import { motion, AnimatePresence } from 'framer-motion';

export function StoryList() {
  const { data: stories, isLoading } = useStories();
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const setSelectedStoryId = useStoryStore((state) => state.setSelectedStoryId);
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<{
    id: string;
    name: string;
    description?: string;
  } | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryDescription, setNewStoryDescription] = useState('');
  const { toast } = useToast();

  const handleCreateStory = () => {
    if (!newStoryName.trim()) return;
    createStory.mutate({ name: newStoryName.trim(), description: newStoryDescription.trim() || undefined }, {
      onSuccess: (story) => {
        setSelectedStoryId(story.id);
        setCreateDialogOpen(false);
        setNewStoryName('');
        setNewStoryDescription('');
      }
    });
  };

  const handleUpdateStory = () => {
    if (!editingStory || !newStoryName.trim()) return;
    updateStory.mutate({ storyId: editingStory.id, data: { name: newStoryName.trim(), description: newStoryDescription.trim() || undefined } }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setEditingStory(null);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingStoryId) return;
    deleteStory.mutate(deletingStoryId, {
      onSuccess: () => {
        if (selectedStoryId === deletingStoryId) setSelectedStoryId(null);
        setDeleteDialogOpen(false);
      }
    });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-[10px]">Loading Workspace...</div>;

  return (
    <div className="flex flex-col h-full min-h-0 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Stories</h2>
        <Button 
          onClick={() => setCreateDialogOpen(true)} 
          size="sm" 
          variant="premium" 
          className="rounded-full px-4 h-8 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">New Story</span>
        </Button>
      </div>

      {/* Story List Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        <AnimatePresence mode="popLayout">
          {stories?.map((story) => (
            <motion.div
              key={story.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer border border-white/[0.04] bg-[#111111]',
                selectedStoryId === story.id ? 'bg-[#1e1e20] border-primary/40' : 'hover:bg-white/[0.04]'
              )}
              onClick={() => setSelectedStoryId(story.id)}
            >
              <div className="flex flex-col gap-1 pr-6">
                 <h3 className="font-bold text-foreground text-[15px] truncate">{story.name}</h3>
                 <p className="text-[12px] text-muted-foreground/60 line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                   {story.description || 'Professional multi-voice project.'}
                 </p>
                 <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                    <span>{story.item_count} {story.item_count === 1 ? 'Item' : 'Items'}</span>
                    <span className="opacity-30">•</span>
                    <span className="text-muted-foreground/40 font-normal lowercase italic">{formatDate(story.updated_at)}</span>
                 </div>
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#111111] border-white/10">
                    <DropdownMenuItem onClick={() => { setEditingStory(story); setNewStoryName(story.name); setNewStoryDescription(story.description || ''); setEditDialogOpen(true); }}>
                      <Pencil className="mr-2 h-3 w-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setDeletingStoryId(story.id); setDeleteDialogOpen(true); }} className="text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#111111] border-white/10">
          <DialogHeader><DialogTitle>New Workspace</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input placeholder="Meme Story" value={newStoryName} onChange={(e) => setNewStoryName(e.target.value)} className="bg-[#0a0a0a] border-white/5" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Details about this conversation..." value={newStoryDescription} onChange={(e) => setNewStoryDescription(e.target.value)} className="bg-[#0a0a0a] border-white/5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="premium" onClick={handleCreateStory}>Initialize Story</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
