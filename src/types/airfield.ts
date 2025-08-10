export interface Airfield {
  id: string;
  name: string;
  icao: string; // ICAO code (if available)
  type: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  visited: boolean;
  planned: boolean;
  notes?: string;
  runwayLength?: number;
  runwaySurface?: string;
  elevation?: number;
  private: boolean;
}

export interface FlightPath {
  id: string;
  name: string;
  date: string;
  coordinates: Array<[number, number]>;
  departure?: string; // Airfield ID
  arrival?: string; // Airfield ID
  fileType: 'KML' | 'GPX';
  fileName: string;
}