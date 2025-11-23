/**
 * Service for sharing flights and airfields with zero-knowledge encryption
 */

import { ShareableData, ShareResponse, CreateShareRequest } from '@/types/share';
import { encryptData, generateEncryptionKey } from '@/lib/encryption';
import { Airfield, FlightPath } from '@/types/airfield';

// Backend API endpoint - replace with your actual backend URL
const SHARE_API_URL = import.meta.env.VITE_SHARE_API_URL || 'http://localhost:3008/api/shares';

/**
 * Create a shareable link for flights and airfields
 * @param airfields - List of airfields to share
 * @param flightPaths - List of flight paths to share
 * @param title - Optional title for the share
 * @returns Object containing the share URL with encryption key in anchor
 */
export async function createShare(
  airfields: Airfield[],
  flightPaths: FlightPath[],
  title?: string
): Promise<{ url: string; key: string; id: string }> {
  // Generate encryption key
  const encryptionKey = generateEncryptionKey();
  
  // Create minimal payload
  const shareData: ShareableData = {
    version: '1.0',
    airfields,
    flightPaths,
    metadata: {
      createdAt: new Date().toISOString(),
      totalAirfields: airfields.length,
      totalFlights: flightPaths.length,
      title
    }
  };
  
  // Encrypt the data
  const encryptedData = await encryptData(shareData, encryptionKey);
  
  // Send to backend
  const response = await fetch(SHARE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedData,
      expiresIn: 30 * 24 * 60 * 60 // 30 days default
    } as CreateShareRequest)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create share');
  }
  
  const result: ShareResponse = await response.json();
  
  // Create share URL with encryption key in the anchor (fragment)
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/share/${result.id}#${encryptionKey}`;
  
  return {
    url: shareUrl,
    key: encryptionKey,
    id: result.id
  };
}

/**
 * Retrieve shared data from backend
 * @param shareId - The share ID from the URL
 * @returns Encrypted data string
 */
export async function getShare(shareId: string): Promise<string> {
  const response = await fetch(`${SHARE_API_URL}/${shareId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Share not found or has expired');
    }
    throw new Error('Failed to retrieve share');
  }
  
  const result = await response.json();
  return result.encryptedData;
}
