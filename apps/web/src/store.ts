/**
 * Zustand store for ephemeral UI state only: which tab is active, which
 * history row is expanded for editing. Domain state (days, photos, settings)
 * lives in Dexie and is read via `useLiveQuery`, not from here.
 */
import { create } from 'zustand';

export type TabKey = 'today' | 'history' | 'stats' | 'settings';

interface AppState {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  editingDate: string | null;
  setEditingDate: (d: string | null) => void;
}

export const useApp = create<AppState>((set) => ({
  tab: 'today',
  setTab: (tab) => set({ tab }),
  editingDate: null,
  setEditingDate: (editingDate) => set({ editingDate }),
}));
