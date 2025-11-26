/**
 * OpenAIP service to fetch airfield data
 * Documentation: https://docs.openaip.net/
 */

import { Airfield } from '@/types/airfield';
import { v4 as uuidv4 } from 'uuid';

// Backend API endpoint
const BACKEND_API_URL = import.meta.env.BACKEND_URL || 'http://localhost:3008';

// OpenAIP response types
interface OpenAIPAirport {
  id: string;
  country: string;
  name: string;
  icaoCode: string;
  iataCode?: string;
  type: number;
  geometry: {
    type: string;
    coordinates: [];
  };
  elevation: {
    value: number;
    unit: number;
  }
  runways?: {
    designator: string;
    trueHeading: number;
    dimension: {
      length: {
        value: number;
        unit: string;
      };
      width: {
        value: number;
        unit: string;
      };
      surface: string;
    }
  }[],
  frequencies: [],
  ppr: boolean
  private: boolean;
}

interface OpenAIPResponse {
  results: OpenAIPAirport[];
  total: number;
  page: number;
  limit: number;
}

// Helper function to convert OpenAIP airport to our Airfield model
const convertToAirfield = (airport: OpenAIPAirport): Airfield => {
  // Find the longest runway if there are any
  const longestRunway = airport.runways?.reduce((prev, current) => 
    (prev.dimension.length.value > current.dimension.length.value) ? prev : current, 
    airport.runways[0]);

  return {
    id: uuidv4(), // Generate a new ID for our system
    name: airport.name,
    icao: airport.icaoCode || '',
    type: airport.type,
    private: airport.private,
    coordinates: {
      lat: airport.geometry.coordinates.at(1),
      lng: airport.geometry.coordinates.at(0),
    },
    visited: false, // Default to not visited
    planned: false, // Default to not planned
    notes: '',
    elevation: airport.elevation.value,
    runwayLength: longestRunway?.dimension.length.value,
  };
};

/**
 * Search airports from OpenAIP
 * https://docs.openaip.net/#/Airports/get_airports
 * @param searchTerm Search term (can be airport name, ICAO code, etc.)
 * @param limit Maximum number of results to return (default: 20)
 * @returns Promise with array of Airfield objects
 */
export const searchAirfields = async (
  searchTerm: string,
  limit: number = 10
): Promise<Airfield[]> => {
  try {
    // Call our backend instead of OpenAIP directly
    const response = await fetch(
      `${BACKEND_API_URL}/api/airports/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`);
    }

    const data = await response.json();

    // Convert the OpenAIP format to our Airfield format
    return data.items.map(convertToAirfield);
  } catch (error) {
    console.error('Error searching airfields:', error);
    return [];
  }
};
