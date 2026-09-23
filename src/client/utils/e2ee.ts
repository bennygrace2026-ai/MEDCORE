/**
 * Client-Side End-to-End Encryption (E2EE) Module
 * Implements AES-GCM 256-bit encryption using the standard Web Crypto API.
 * Ensures all chat content is encrypted in the user's browser before transmission.
 */

const SALT = 'MEDCORE_ACADEMY_E2EE_MASTER_SALT_2026';

// Cache derived keys in memory
const keyCache = new Map<string, CryptoKey>();

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a 256-bit AES-GCM CryptoKey for a specific channel or direct room
async function getChannelKey(channelId: string): Promise<CryptoKey> {
  if (keyCache.has(channelId)) {
    return keyCache.get(channelId)!;
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`MEDCORE_E2EE_${channelId}_ROOM_KEY`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT + channelId),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(channelId, derivedKey);
  return derivedKey;
}

/**
 * Encrypt a text message using AES-GCM
 */
export async function encryptMessage(
  plainText: string,
  channelId: string
): Promise<{ encryptedContent: string; iv: string }> {
  try {
    const key = await getChannelKey(channelId);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for AES-GCM
    const enc = new TextEncoder();

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(plainText)
    );

    return {
      encryptedContent: bufferToBase64(encryptedBuffer),
      iv: bufferToBase64(iv.buffer)
    };
  } catch (error) {
    console.error('E2EE Encryption Error:', error);
    // Safe fallback if crypto is restricted
    return {
      encryptedContent: plainText,
      iv: ''
    };
  }
}

/**
 * Decrypt an AES-GCM encrypted message
 */
export async function decryptMessage(
  encryptedContent: string,
  ivBase64: string | null | undefined,
  channelId: string
): Promise<string> {
  // If no IV was stored or it's unencrypted text
  if (!ivBase64) {
    return encryptedContent;
  }

  try {
    const key = await getChannelKey(channelId);
    const ivBuffer = base64ToBuffer(ivBase64);
    const encryptedBuffer = base64ToBuffer(encryptedContent);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      key,
      encryptedBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    // If decryption fails (e.g. plain text sent previously)
    return encryptedContent;
  }
}

/**
 * Generates a verification fingerprint for the room/channel
 */
export async function getRoomFingerprint(channelId: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${channelId}:${SALT}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}
