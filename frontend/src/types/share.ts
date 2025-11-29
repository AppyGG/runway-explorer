import { Airfield, FlightPath } from './airfield';

/**
 * Shareable data structure - minimal payload
 */
export interface ShareableData {
  version: string; // Format version for future compatibility
  airfields: Airfield[];
  flightPaths: FlightPath[];
  metadata: {
    createdAt: string;
    totalAirfields: number;
    totalFlights: number;
    title?: string; // Optional title for the share
  };
}

/**
 * Response from the share API
 */
export interface ShareResponse {
  reference: string; // Unique ID for the share
  expiresAt?: string; // Optional expiration date
}

/**
 * Request to create a share
 */
export interface CreateShareRequest {
  encryptedData: string; // Base64 encoded encrypted data
  expiresIn?: number; // Optional expiration in seconds
}
