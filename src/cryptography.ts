import { readFileSync, writeFileSync, rmSync } from 'fs';
import { encrypt, decrypt } from 'hsynchronous';
import { join } from 'path';
import type { KeyPair } from './types';
import { secureWipe } from './utils';

/**
 * Encrypts and compresses virtual drive data
 * @param {Object} keypair - The encryption key pair
 * @param {string} ZIP_FILE - The name/path of the zip file to process
 * @throws Will throw an error if any step in the process fails
 */
export async function encryptCompressVirtualDrive(KEYPAIR: KeyPair, ZIP_FILE: string) {
    try {
        // Construct full path to the zip file
        const zipFile = join(__dirname, '../', ZIP_FILE);

        // Read the zip file contents
        let data;
        try {
            data = readFileSync(zipFile, 'hex');
        } catch (readError: any) {
            throw new Error(`Failed to read zip file: ${readError.message}`);
        }

        // Remove the original zip file (forcefully if needed)
        try {
            rmSync(zipFile, { force: true });
        } catch (removeError: any) {
            throw new Error(`Failed to remove original zip file: ${removeError.message}`);
        }

        // Encrypt the data using the provided keypair
        let encryptedData;
        try {
            encryptedData = await encrypt(data, KEYPAIR);
            secureWipe(KEYPAIR);
        } catch (encryptError: any) {
            throw new Error(`Encryption failed: ${encryptError.message}`);
        }

        // Write the encrypted data to file
        const encryptedFilePath = join(__dirname, '../', 'encrypted');
        try {
            writeFileSync(encryptedFilePath, encryptedData);
        } catch (writeError: any) {
            throw new Error(`Failed to write encrypted file: ${writeError.message}`);
        }

    } catch (error: any) {
        // Rethrow any errors with context
        throw new Error(`encryptCompressVirtualDrive failed: ${error.message}`);
    }
}

/**
 * Decrypts virtual drive data and restores it to a zip file
 * @param {Object} keypair - The decryption key pair
 * @param {string} ZIP_FILE - The name/path for the output zip file
 * @throws Will throw an error if any step in the process fails
 */
export async function decryptVirtualDrive(KEYPAIR: KeyPair, ZIP_FILE: string, ENCRYPTED_FILE: string) {
    try {
        // Construct full path to the encrypted file and target zip file
        const encryptedFilePath = join(process.cwd(), ENCRYPTED_FILE);
        const zipFile = join(__dirname, '../', ZIP_FILE);

        // Read the encrypted data
        let encryptedData;
        try {
            encryptedData = readFileSync(encryptedFilePath, 'utf8');
        } catch (readError: any) {
            throw new Error(`Failed to read encrypted file: ${readError.message}`);
        }

        // Decrypt the data using the provided keypair
        let decryptedData;
        try {
            decryptedData = await decrypt(encryptedData, KEYPAIR);
            secureWipe(KEYPAIR);
        } catch (decryptError: any) {
            throw new Error(`Decryption failed: ${decryptError.message}`);
        }

        // Verify decrypted data contains the expected message
        if (!decryptedData || !decryptedData.message) {
            throw new Error('Decrypted data is invalid or missing message');
        }

        // Write the decrypted data to the zip file
        try {
            writeFileSync(zipFile, decryptedData.message, {
                encoding: 'hex'
            });
        } catch (writeError: any) {
            throw new Error(`Failed to write decrypted file: ${writeError.message}`);
        }

    } catch (error: any) {
        // Rethrow any errors with context
        throw new Error(`decryptVirtualDrive failed: ${error.message}`);
    }
}