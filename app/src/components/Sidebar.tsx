import {
  Mic2,
  Settings2,
  Layers,
  Sparkles,
  History,
  FileText,
  Volume2,
  ChevronRight,
  User,
  Zap,
  Box,
  Speaker,
} from 'lucide-react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { cn } from '@/lib/utils/cn';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "nav-item group relative mb-1",
      active && "active"
    )}
  >
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 relative z-10",
      active ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground group-hover:text-foreground group-hover:bg-white/10"
    )}>
      <Icon className="h-4 w-4" />
    </div>
    <span className={cn(
      "font-medium text-sm tracking-tight relative z-10 ml-3",
      active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
    )}>{label}</span>
    {active && (
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse z-10" />
    )}
  </Link>
);

export function Sidebar({ isMacOS }: { isMacOS?: boolean }) {
  const matchRoute = useMatchRoute();

  const navItems = [
    { to: '/', icon: Sparkles, label: 'Studio' },
    { to: '/stories', icon: Layers, label: 'Stories' },
    { to: '/transcribe', icon: FileText, label: 'Transcribe' },
    { to: '/voices', icon: Mic2, label: 'Voices' },
    { to: '/audio', icon: Speaker, label: 'Audio' },
    { to: '/models', icon: Box, label: 'Models' },
    { to: '/server', icon: Settings2, label: 'Server' },
  ];

  return (
    <div className={cn(
      "w-64 h-full bg-sidebar border-r border-white/5 flex flex-col p-4 z-50",
      isMacOS && "pt-12"
    )}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
          <Volume2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tighter text-foreground leading-none">VOICEBOX</span>
          <span className="text-[10px] font-bold text-primary/80 uppercase tracking-[0.2em] mt-1">Pro Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3 opacity-30">
          Workspace
        </div>
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={item.to === '/' ? matchRoute({ to: '/', exact: true }) : matchRoute({ to: item.to })}
          />
        ))}
      </nav>

      {/* User Section */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">Captain COd</div>
            <div className="text-[10px] text-primary flex items-center gap-1">
               <Zap className="h-2 w-2 fill-current" />
               PRO PLAN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
