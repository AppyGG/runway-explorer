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

export interface Waypoint {
  lat: number;
  lng: number;
  altitude?: number; // in feet
  speed?: number; // in knots
  timestamp?: string; // ISO 8601 format
}

export interface FlightPath {
  id: string;
  name: string;
  date: string;
  coordinates: Array<[number, number]>; // For backward compatibility and map display
  waypoints?: Waypoint[]; // Detailed waypoint data with altitude, speed, etc.
  departure?: string; // Airfield ID
  arrival?: string; // Airfield ID
  fileType: 'KML' | 'GPX';
  fileName: string;
}