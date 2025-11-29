/**
 * Zero-knowledge encryption utilities for sharing flights and airfields
 * Uses Web Crypto API for AES-GCM encryption
 */

/**
 * Generate a random 32-character encryption key
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert a hex string to a CryptoKey for AES-GCM
 */
async function hexToKey(hexKey: string): Promise<CryptoKey> {
  const keyData = new Uint8Array(hexKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 * @param data - The data to encrypt (will be JSON stringified)
 * @param key - 32-character hex encryption key
 * @returns Base64 encoded encrypted data with IV prepended
 */
export async function encryptData(data: any, key: string): Promise<string> {
  const cryptoKey = await hexToKey(key);
  
  // Generate a random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert data to JSON and then to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    dataBuffer
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Convert to base64 in chunks to avoid call stack size exceeded error
  const chunkSize = 8192; // Process 8KB at a time
  let binaryString = '';
  for (let i = 0; i < combined.length; i += chunkSize) {
    const chunk = combined.subarray(i, Math.min(i + chunkSize, combined.length));
    binaryString += String.fromCharCode(...chunk);
  }
  return btoa(binaryString);
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData - Base64 encoded encrypted data with IV prepended
 * @param key - 32-character hex encryption key
 * @returns Decrypted and parsed data
 */
export async function decryptData(encryptedData: string, key: string): Promise<any> {
  const cryptoKey = await hexToKey(key);
  
  // Decode base64 - handle large data by processing in chunks
  const binaryString = atob(encryptedData);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  // Convert back to string and parse JSON
  const decoder = new TextDecoder();
  const decryptedString = decoder.decode(decryptedBuffer);
  
  return JSON.parse(decryptedString);
}

/**
 * Validate an encryption key format
 */
export function isValidEncryptionKey(key: string): boolean {
  return /^[0-9a-f]{32}$/i.test(key);
}
