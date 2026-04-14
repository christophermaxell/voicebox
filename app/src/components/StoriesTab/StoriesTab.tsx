import { useStory } from '@/lib/hooks/useStories';
import { useStoryStore } from '@/stores/storyStore';
import { StoryContent } from './StoryContent';
import { StoryList } from './StoryList';
import { StoryTrackEditor } from './StoryTrackEditor';

export function StoriesTab() {
  const selectedStoryId = useStoryStore((state) => state.selectedStoryId);
  const { data: story } = useStory(selectedStoryId);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#08090a] overflow-hidden relative">
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar - Story List (Fixed Width / Native Sidebar Feel) */}
        <div className="w-[360px] shrink-0 border-r border-white/[0.04] bg-[#0d0e0f]/50 backdrop-blur-md">
           <StoryList />
        </div>

        {/* Right Area - Story Content & Timeline */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 min-h-0 pb-[180px]">
             <StoryContent />
          </div>
          
          {/* Main Timeline (Anchored to this Viewport) */}
          {story && story.items.length > 0 && (
             <StoryTrackEditor storyId={story.id} items={story.items} />
          )}
        </main>
      </div>
    </div>
  );
}
