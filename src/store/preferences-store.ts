import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MapPreferences {
  flightPathColor: string;
  selectedFlightPathColor: string;
  flightPathWidth: number;
  selectedFlightPathWidth: number;
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
  selectedFlightPathWidth: 4
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