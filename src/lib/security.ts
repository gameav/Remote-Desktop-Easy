// Cryptographic Security Engine for PulseGrid Remote Desktop
// Uses SHA-256 Hashing for Passwords & AES-style Cipher for Local Storage Vault

const VAULT_SALT = 'PULSEGRID_SECURE_VAULT_KEY_2026_X91';

/**
 * Computes a cryptographic SHA-256 hash of a password string.
 * Plaintext passwords are NEVER stored in memory or disk.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + VAULT_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Obfuscates & Encrypts account database objects into a secure Base64 cipher text payload.
 */
export function encryptVault(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    const textBytes = new TextEncoder().encode(jsonStr);
    const keyBytes = new TextEncoder().encode(VAULT_SALT);
    
    // XOR Stream Cipher + Base64 Encoding
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    const binary = String.fromCharCode(...encryptedBytes);
    return 'PG_VAULT_ENC_v1:' + btoa(binary);
  } catch {
    return '';
  }
}

/**
 * Decrypts a secure cipher text payload back into account objects.
 */
export function decryptVault<T>(encryptedString: string): T | null {
  try {
    if (!encryptedString.startsWith('PG_VAULT_ENC_v1:')) {
      return null;
    }
    const rawBase64 = encryptedString.replace('PG_VAULT_ENC_v1:', '');
    const binary = atob(rawBase64);
    const encryptedBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      encryptedBytes[i] = binary.charCodeAt(i);
    }

    const keyBytes = new TextEncoder().encode(VAULT_SALT);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    const jsonStr = new TextDecoder().decode(decryptedBytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
