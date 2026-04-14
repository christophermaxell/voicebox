import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Use VITE_SERVER_URL if set at build time, otherwise fall back to localhost
// This is replaced statically by Vite during the production build
const DEFAULT_SERVER_URL =
  (import.meta as unknown as { env?: { VITE_SERVER_URL?: string } }).env?.VITE_SERVER_URL ||
  'http://127.0.0.1:17493';

interface ServerStore {
  serverUrl: string;
  setServerUrl: (url: string) => void;

  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  mode: 'local' | 'remote';
  setMode: (mode: 'local' | 'remote') => void;

  keepServerRunningOnClose: boolean;
  setKeepServerRunningOnClose: (keepRunning: boolean) => void;
}

export const useServerStore = create<ServerStore>()(
  persist(
    (set) => ({
      serverUrl: DEFAULT_SERVER_URL,
      setServerUrl: (url) => set({ serverUrl: url }),

      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),

      mode: 'local',
      setMode: (mode) => set({ mode }),

      keepServerRunningOnClose: false,
      setKeepServerRunningOnClose: (keepRunning) => set({ keepServerRunningOnClose: keepRunning }),
    }),
    {
      name: 'voicebox-server',
      // Override persisted serverUrl with the build-time env var on hydration.
      // This ensures old localhost URLs cached in localStorage are replaced.
      onRehydrateStorage: () => (state) => {
        if (state && DEFAULT_SERVER_URL !== 'http://127.0.0.1:17493') {
          state.serverUrl = DEFAULT_SERVER_URL;
        }
      },
    },
  ),
);
