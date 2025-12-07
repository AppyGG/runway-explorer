import { create } from 'zustand';

interface MapInteractionState {
  hoveredWaypointIndex: number | null;
  setHoveredWaypointIndex: (index: number | null) => void;
}

export const useMapInteractionStore = create<MapInteractionState>((set) => ({
  hoveredWaypointIndex: null,
  setHoveredWaypointIndex: (index) => set({ hoveredWaypointIndex: index }),
}));
