import { Link, useMatchRoute } from '@tanstack/react-router';
import { Box, BookOpen, Loader2, Mic, Server, Speaker, Volume2, FileText } from 'lucide-react';
import voiceboxLogo from '@/assets/voicebox-logo.png';
import { cn } from '@/lib/utils/cn';
import { useGenerationStore } from '@/stores/generationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { motion } from 'framer-motion';

interface SidebarProps {
  isMacOS?: boolean;
}

const tabs = [
  { id: 'main', path: '/', icon: Volume2, label: 'Generate' },
  { id: 'stories', path: '/stories', icon: BookOpen, label: 'Stories' },
  { id: 'voices', path: '/voices', icon: Mic, label: 'Voices' },
  { id: 'audio', path: '/audio', icon: Speaker, label: 'Audio' },
  { id: 'transcribe', path: '/transcribe', icon: FileText, label: 'Transcription' },
  { id: 'models', path: '/models', icon: Box, label: 'Models' },
];

export function Sidebar({ isMacOS }: SidebarProps) {
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;
  const matchRoute = useMatchRoute();

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-full w-20 bg-sidebar border-r border-border flex flex-col items-center py-8 gap-8 z-50',
        'backdrop-blur-md bg-opacity-80',
        isMacOS && 'pt-14',
      )}
    >
      {/* Logo with subtle glow */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(94,106,210,0.4)]">
           <Volume2 className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex flex-col gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === '/'
              ? matchRoute({ to: '/', exact: true })
              : matchRoute({ to: tab.path });

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="relative group p-0.5"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative',
                  isActive 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
                title={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_20px_rgba(94,106,210,0.4)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="h-5 w-5 relative z-10" />
              </div>
              
              {/* Tooltip-like label on hover if we wanted it wider, but for now just the icon */}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col gap-4 mb-4">
        <Link
          to="/server"
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
            'text-muted-foreground hover:text-foreground hover:bg-white/5',
            matchRoute({ to: '/server' }) && 'text-foreground bg-white/5'
          )}
          title="Server Settings"
        >
          <Server className="h-5 w-5" />
        </Link>

        {/* Generation Loader */}
        {isGenerating ? (
          <div
            className={cn(
              'w-12 h-12 flex items-center justify-center transition-all duration-500 bg-primary/10 rounded-xl border border-primary/20',
              isPlayerVisible ? 'translate-y-[-100px]' : 'translate-y-0',
            )}
          >
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        ) : (
             <div className="w-12 h-12 flex items-center justify-center text-muted-foreground/30">
                <div className="w-1.5 h-1.5 bg-current rounded-full" />
             </div>
        )}
      </div>
    </div>
  );
}
