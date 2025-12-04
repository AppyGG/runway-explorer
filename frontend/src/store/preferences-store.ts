import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DistanceUnit = 'nm' | 'km' | 'mi';
export type SpeedUnit = 'kt' | 'kmh' | 'mph';
export type AircraftType = 'airplane' | 'ultralight' | 'glider' | 'heli' | null;

export interface MapPreferences {
  flightPathColor: string;
  selectedFlightPathColor: string;
  flightPathWidth: number;
  selectedFlightPathWidth: number;
  hideOtherFlightPaths: boolean; // Hide other flight paths when one is selected
  fadeOtherFlightPaths: boolean; // Fade other flight paths when one is selected (if hideOtherFlightPaths is false)
  otherFlightPathsOpacity: number; // Opacity of other flight paths when faded (0-1)
  showHeatmap: boolean; // Show heatmap of flight paths
  heatmapIntensity: number; // Heatmap intensity (0-1)
  heatmapRadius: number; // Heatmap point radius in pixels
}

export interface UnitPreferences {
  distance: DistanceUnit;
  speed: SpeedUnit;
}

export interface UserPreferences {
  aircraftType: AircraftType;
  hasCompletedOnboarding: boolean;
}

export interface PreferencesState {
  map: MapPreferences;
  units: UnitPreferences;
  user: UserPreferences;

  // Actions
  updateMapPreferences: (preferences: Partial<MapPreferences>) => void;
  resetMapPreferences: () => void;
  updateUnitPreferences: (preferences: Partial<UnitPreferences>) => void;
  resetUnitPreferences: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  flightPathColor: '#3f80d5ff', // Default blue color
  selectedFlightPathColor: '#ff0000', // Default red color
  flightPathWidth: 4,
  selectedFlightPathWidth: 4,
  hideOtherFlightPaths: false,
  fadeOtherFlightPaths: true,
  otherFlightPathsOpacity: 0.3,
  showHeatmap: false,
  heatmapIntensity: 0.4,
  heatmapRadius: 5
};

const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  distance: 'nm', // Nautical miles (default for aviation)
  speed: 'kt' // Knots (default for aviation)
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  aircraftType: null,
  hasCompletedOnboarding: false
};

export const TYPE_FILTERS = {
  'airplane': [0, 2, 3, 8, 13],
  'ultralight': [0, 2, 3, 6, 11, 13],
  'glider': [1, 2],
  'heli': [0, 2, 3, 7]
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      map: { ...DEFAULT_MAP_PREFERENCES },
      units: { ...DEFAULT_UNIT_PREFERENCES },
      user: { ...DEFAULT_USER_PREFERENCES },
      
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
      })),
      
      updateUserPreferences: (preferences) => set((state) => ({
        user: { ...state.user, ...preferences }
      })),
      
      setOnboardingComplete: (complete) => set((state) => ({
        user: { ...state.user, hasCompletedOnboarding: complete }
      }))
    }),
    {
      name: 'preferences-storage'
    }
  )
);