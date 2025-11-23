import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MapPreferences {
  flightPathColor: string;
  selectedFlightPathColor: string;
  flightPathWidth: number;
  selectedFlightPathWidth: number;
  hideOtherFlightPaths: boolean; // Hide other flight paths when one is selected
  fadeOtherFlightPaths: boolean; // Fade other flight paths when one is selected (if hideOtherFlightPaths is false)
  otherFlightPathsOpacity: number; // Opacity of other flight paths when faded (0-1)
}

export interface PreferencesState {
  map: MapPreferences;
  openAipToken: string;

  // Actions
  updateMapPreferences: (preferences: Partial<MapPreferences>) => void;
  resetMapPreferences: () => void;
  updateOpenAipToken: (token: string) => void;
}

const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  flightPathColor: '#d53f94ff', // Default blue color
  selectedFlightPathColor: '#ff0000', // Default red color
  flightPathWidth: 4,
  selectedFlightPathWidth: 4,
  hideOtherFlightPaths: false,
  fadeOtherFlightPaths: true,
  otherFlightPathsOpacity: 0.3
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      map: { ...DEFAULT_MAP_PREFERENCES },
      
      updateMapPreferences: (preferences) => set((state) => ({
        map: { ...state.map, ...preferences }
      })),
      
      resetMapPreferences: () => set(() => ({
        map: { ...DEFAULT_MAP_PREFERENCES }
      }))
    }),
    {
      name: 'preferences-storage'
    }
  )
);