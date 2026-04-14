import {
  Mic2,
  Settings2,
  Layers,
  Sparkles,
  History,
  FileText,
  Volume2,
  Box,
  Speaker,
} from 'lucide-react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

const TabItem = ({ to, icon: Icon, active }: { to: string, icon: any, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
      active ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(234,179,8,0.1)] border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
    )}
  >
    {active && (
      <motion.div
        layoutId="active-tab-indicator"
        className="absolute -left-4 w-1 h-6 bg-primary rounded-r-full"
      />
    )}
    <Icon className="h-5 w-5" />
    <div className="absolute left-16 px-2 py-1 bg-popover border border-border rounded text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none z-50">
       {to === '/' ? 'Studio' : to.replace('/', '')}
    </div>
  </Link>
);

export function Sidebar({ isMacOS }: { isMacOS?: boolean }) {
  const matchRoute = useMatchRoute();

  const navItems = [
    { to: '/', icon: Sparkles },
    { to: '/stories', icon: Layers },
    { to: '/transcribe', icon: FileText },
    { to: '/voices', icon: Mic2 },
    { to: '/audio', icon: Speaker },
    { to: '/models', icon: Box },
    { to: '/server', icon: Settings2 },
  ];

  return (
    <div className={cn(
      "w-20 h-full bg-sidebar border-r border-white/5 flex flex-col items-center py-8 gap-10 z-50",
      isMacOS && "pt-14"
    )}>
      {/* Brand Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)] group cursor-pointer">
        <Volume2 className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <TabItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            active={item.to === '/' ? matchRoute({ to: '/', exact: true }) : matchRoute({ to: item.to })}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />
      </div>
    </div>
  );
}
