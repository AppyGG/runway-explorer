import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DistanceUnit = 'nm' | 'km' | 'mi';
export type SpeedUnit = 'kt' | 'kmh' | 'mph';

export interface MapPreferences {
  flightPathColor: string;
  selectedFlightPathColor: string;
  flightPathWidth: number;
  selectedFlightPathWidth: number;
  hideOtherFlightPaths: boolean; // Hide other flight paths when one is selected
  fadeOtherFlightPaths: boolean; // Fade other flight paths when one is selected (if hideOtherFlightPaths is false)
  otherFlightPathsOpacity: number; // Opacity of other flight paths when faded (0-1)
}

export interface UnitPreferences {
  distance: DistanceUnit;
  speed: SpeedUnit;
}

export interface PreferencesState {
  map: MapPreferences;
  units: UnitPreferences;

  // Actions
  updateMapPreferences: (preferences: Partial<MapPreferences>) => void;
  resetMapPreferences: () => void;
  updateUnitPreferences: (preferences: Partial<UnitPreferences>) => void;
  resetUnitPreferences: () => void;
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

const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  distance: 'nm', // Nautical miles (default for aviation)
  speed: 'kt' // Knots (default for aviation)
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      map: { ...DEFAULT_MAP_PREFERENCES },
      units: { ...DEFAULT_UNIT_PREFERENCES },
      
      updateMapPreferences: (preferences) => set((state) => ({
        map: { ...state.map, ...preferences }
      })),
      
      resetMapPreferences: () => set(() => ({
        map: { ...DEFAULT_MAP_PREFERENCES }
      })),
      
      updateUnitPreferences: (preferences) => set((state) => ({
        units: { ...state.units, ...preferences }
      })),
      
      resetUnitPreferences: () => set(() => ({
        units: { ...DEFAULT_UNIT_PREFERENCES }
      }))
    }),
    {
      name: 'preferences-storage'
    }
  )
);