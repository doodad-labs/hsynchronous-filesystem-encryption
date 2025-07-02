import { rmSync, existsSync, readFileSync } from 'fs';
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
            console.debug(`Drive ${DRIVE_LETTER}: was not mounted or could not be unmounted`);
        }

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        throw new Error(`Cleanup failed: ${error.message}`);
    }
}

export async function loadKey(KEYFILE) {
    try {

        const keyPath = join(__dirname, '../', KEYFILE);

        if (!existsSync(keyPath)) {
            throw new Error(`Key file does not exist at path: ${keyPath}`);
        }

        // Read the key file synchronously
        const keyData = readFileSync(keyPath, 'utf8').trim();

        if (!keyData) {
            throw new Error('Key file is empty');
        }

        // Return the key data
        return keyData;

    } catch (error) {
        console.error('Error loading key:', error.message);
        throw new Error(`Failed to load key from ${KEYFILE}: ${error.message}`);
    }

}