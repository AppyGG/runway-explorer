import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Airfield, FlightPath } from '@/types/airfield';
import { v4 as uuidv4 } from 'uuid';

interface AirfieldState {
  airfields: Airfield[];
  flightPaths: FlightPath[];
  homeAirfieldId: string | null;
  
  // Actions
  addAirfield: (airfield: Omit<Airfield, 'id'>) => void;
  updateAirfield: (id: string, updates: Partial<Airfield>) => void;
  deleteAirfield: (id: string) => void;
  toggleVisited: (id: string) => void;
  togglePlanned: (id: string) => void;
  setHomeAirfield: (id: string | null) => void;
  
  // Flight paths
  addFlightPath: (flightPath: Omit<FlightPath, 'id'>) => void;
  deleteFlightPath: (id: string) => void;
}

export const useAirfieldStore = create<AirfieldState>()(
  persist(
    (set) => ({
      airfields: [],
      flightPaths: [],
      homeAirfieldId: '1',
      
      addAirfield: (airfield) => set((state) => ({
        airfields: [...state.airfields, { ...airfield, id: uuidv4() }]
      })),
      
      updateAirfield: (id, updates) => set((state) => ({
        airfields: state.airfields.map(airfield => 
          airfield.id === id ? { ...airfield, ...updates } : airfield
        )
      })),
      
      deleteAirfield: (id) => set((state) => ({
        airfields: state.airfields.filter(airfield => airfield.id !== id),
        homeAirfieldId: state.homeAirfieldId === id ? null : state.homeAirfieldId
      })),
      
      toggleVisited: (id) => set((state) => ({
        airfields: state.airfields.map(airfield => 
          airfield.id === id ? { ...airfield, visited: !airfield.visited } : airfield
        )
      })),
      
      togglePlanned: (id) => set((state) => ({
        airfields: state.airfields.map(airfield => 
          airfield.id === id ? { ...airfield, planned: !airfield.planned } : airfield
        )
      })),
      
      setHomeAirfield: (id) => set(() => ({
        homeAirfieldId: id
      })),
      
      addFlightPath: (flightPath) => set((state) => ({
        flightPaths: [...state.flightPaths, { ...flightPath, id: uuidv4() }]
      })),
      
      deleteFlightPath: (id) => set((state) => ({
        flightPaths: state.flightPaths.filter(flightPath => flightPath.id !== id)
      }))
    }),
    {
      name: 'airfield-storage'
    }
  )
);