import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import ShinyText from '@/components/ShinyText';
import { TitleBarDragRegion } from '@/components/TitleBarDragRegion';
import { useAutoUpdater } from '@/hooks/useAutoUpdater';
import { TOP_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import { cn } from '@/lib/utils/cn';
import { usePlatform } from '@/platform/PlatformContext';
import { router } from '@/router';
import { useServerStore } from '@/stores/serverStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LOADING_MESSAGES = [
  'Warming up tensors...',
  'Calibrating synthesizer engine...',
  'Initializing voice models...',
  'Loading neural networks...',
  'Preparing audio pipelines...',
  'Optimizing waveform generators...',
  'Tuning frequency analyzers...',
  'Building voice embeddings...',
  'Configuring text-to-speech cores...',
  'Syncing audio buffers...',
  'Establishing model connections...',
];

function App() {
  const platform = usePlatform();
  const [serverReady, setServerReady] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const serverStartingRef = useRef(false);

  useAutoUpdater({ checkOnMount: true, showToast: true });

  useEffect(() => {
    if (platform.metadata.isTauri) {
      const keepRunning = useServerStore.getState().keepServerRunningOnClose;
      platform.lifecycle.setKeepServerRunning(keepRunning).catch(console.error);
    }
  }, [platform.metadata.isTauri, platform.lifecycle]);

  useEffect(() => {
    platform.lifecycle.onServerReady = () => setServerReady(true);
  }, [platform.lifecycle]);

  useEffect(() => {
    if (!platform.metadata.isTauri) {
      platform.lifecycle.startServer(false)
        .then((serverUrl) => {
          useServerStore.getState().setServerUrl(serverUrl);
          setServerReady(true);
        })
        .catch(() => setServerReady(true));
      return;
    }

    platform.lifecycle.setupWindowCloseHandler().catch(console.error);

    if (!import.meta.env?.PROD) {
      setServerReady(true);
      return;
    }

    if (serverStartingRef.current) return;
    serverStartingRef.current = true;

    platform.lifecycle.startServer(false)
      .then((serverUrl) => {
        useServerStore.getState().setServerUrl(serverUrl);
        setServerReady(true);
      })
      .catch((error) => {
        console.error('Failed to auto-start server:', error);
        serverStartingRef.current = false;
        setServerReady(true); // Fail gracefully
      });

    return () => {
      serverStartingRef.current = false;
    };
  }, [platform.metadata.isTauri, platform.lifecycle]);

  useEffect(() => {
    if (serverReady) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [serverReady]);

  if (!serverReady) {
    return (
      <div className="min-h-screen bg-[#08090a] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <TitleBarDragRegion />
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 blur-[150px] -z-10 opacity-30" />
        
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="flex flex-col items-center gap-8 text-center"
        >
          <div className="relative">
             <Loader2 className="h-8 w-8 text-primary animate-spin opacity-50" />
          </div>

          <div className="space-y-4">
             <AnimatePresence mode="wait">
               <motion.div
                 key={loadingMessageIndex}
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 transition={{ duration: 0.5 }}
               >
                 <ShinyText
                    text={LOADING_MESSAGES[loadingMessageIndex]}
                    className="text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground/40"
                    speed={2}
                    color="rgba(255,255,255,0.1)"
                    shineColor="rgba(255,255,255,0.6)"
                 />
               </motion.div>
             </AnimatePresence>
             <div className="w-32 h-[1px] bg-white/5 mx-auto relative overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-primary/40"
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
