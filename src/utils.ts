import { rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cleans up virtual drive resources including folder, zip file, and drive mapping
 * @param {string} DRIVE_LETTER - The drive letter to unmount (Windows only)
 * @param {string} FOLDER_PATH - The folder path to delete
 * @param {string} ZIP_FILE - The zip file path to delete
 * @throws Will throw an error if cleanup operations fail (except for unmount which is best-effort)
 */
export async function cleanup(DRIVE_LETTER, FOLDER_PATH, ZIP_FILE) {
    try {
        // Construct full paths to ensure correct file system operations
        const fullPath = join(__dirname, '../', FOLDER_PATH);
        const zipFilePath = join(__dirname, '../', ZIP_FILE);

        // Remove the virtual drive folder if it exists
        try {
            if (existsSync(fullPath)) {
                rmSync(fullPath, { recursive: true, force: true });
                console.log(`Successfully removed folder: ${fullPath}`);
            }
        } catch (folderError) {
            console.warn(`Warning: Could not remove folder ${fullPath}: ${folderError.message}`);
        }

        // Remove the zip file if it exists
        try {
            if (existsSync(zipFilePath)) {
                rmSync(zipFilePath, { force: true });
                console.log(`Successfully removed zip file: ${zipFilePath}`);
            }
        } catch (zipError) {
            console.warn(`Warning: Could not remove zip file ${zipFilePath}: ${zipError.message}`);
        }

        // Platform-specific cleanup operations
        const os = platform();
        
        // Attempt to unmount the drive (best-effort, errors are suppressed but logged)
        try {
            if (os === 'win32') {
                // Windows: Remove the subst drive mapping if it exists
                const command = `subst ${DRIVE_LETTER}: /D`;
                await execAsync(command);
                console.log(`Successfully unmounted drive ${DRIVE_LETTER}:`);
            } else {
                console.warn(`Cleanup for platform ${os} only supports file deletion, not unmounting`);
            }
        } catch (unmountError) {
            // Silently ignore unmount errors as the drive might not be mounted
        }

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        throw new Error(`Cleanup failed: ${error.message}`);
    }
}

/**
 * Loads and validates a cryptographic key from a file
 * @param {string} KEYFILE - The filename/path of the key file to load
 * @returns {Promise<string>} The key data as a trimmed string
 * @throws {Error} If the key file doesn't exist, is empty, or contains invalid data
 */
export async function loadKey(KEYFILE) {
    try {
        // Construct absolute path to the key file
        const keyPath = join(__dirname, '../', KEYFILE);

        // Verify key file exists before attempting to read
        if (!existsSync(keyPath)) {
            throw new Error(`Key file not found at path: ${keyPath}`);
        }

        // Read key file contents synchronously
        let keyData;
        try {
            keyData = readFileSync(keyPath, 'utf8');
        } catch (readError) {
            throw new Error(`Failed to read key file: ${readError.message}`);
        }

        // Trim whitespace and validate content
        const trimmedKey = keyData.trim();
        if (!trimmedKey) {
            throw new Error('Key file is empty (contains only whitespace)');
        }

        // Return validated key data
        return trimmedKey;

    } catch (error) {
        // Enhance and rethrow the error with additional context
        const errorMessage = `Failed to load key from ${KEYFILE}: ${error.message}`;
        console.error(`Key loading error: ${errorMessage}`);
        throw new Error(errorMessage);
    }
}