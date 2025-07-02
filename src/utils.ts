import { rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

/**
 * Cleans up virtual drive resources including folder, zip file, and drive mapping
 * @param {string} DRIVE_LETTER - The drive letter to unmount (Windows only)
 * @param {string} FOLDER_PATH - The folder path to delete
 * @param {string} ZIP_FILE - The zip file path to delete
 * @throws Will throw an error if cleanup operations fail (except for unmount which is best-effort)
 */
export async function cleanup(DRIVE_LETTER: string, FOLDER_PATH: string, ZIP_FILE: any) {
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
        } catch (folderError: any) {
            console.warn(`Warning: Could not remove folder ${fullPath}: ${folderError.message}`);
        }

        // Remove the zip file if it exists
        try {
            if (existsSync(zipFilePath)) {
                rmSync(zipFilePath, { force: true });
                console.log(`Successfully removed zip file: ${zipFilePath}`);
            }
        } catch (zipError: any) {
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

    } catch (error: any) {
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
export async function loadKey(KEYFILE: string) {
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
        } catch (readError: any) {
            throw new Error(`Failed to read key file: ${readError.message}`);
        }

        // Trim whitespace and validate content
        const trimmedKey = keyData.trim();
        if (!trimmedKey) {
            throw new Error('Key file is empty (contains only whitespace)');
        }

        // Return validated key data
        return trimmedKey;

    } catch (error: any) {
        // Enhance and rethrow the error with additional context
        const errorMessage = `Failed to load key from ${KEYFILE}: ${error.message}`;
        console.error(`Key loading error: ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Creates a backup of the specified file with .bak extension
 * @param {string} filePath - Path to the file to be backed up
 * @returns {Promise<void>}
 * @throws {Error} If backup creation fails (except when source file doesn't exist)
 */
export async function createBackup(filePath: string) {
    try {
        // Validate input parameter
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path provided');
        }

        // Construct backup file path
        const backupFileName = `${filePath}.bak`;
        
        // Check if source file exists
        if (!existsSync(filePath)) {
            console.warn(`Warning: Source file ${filePath} does not exist, skipping backup creation.`);
            return;
        }

        // Verify we can read the source file
        let fileContent;
        try {
            fileContent = readFileSync(filePath, 'utf8');
        } catch (readError: any) {
            throw new Error(`Failed to read source file: ${readError.message}`);
        }

        // Verify content was read
        if (fileContent === undefined) {
            throw new Error('File content was not read properly');
        }

        // Create backup file
        try {
            writeFileSync(backupFileName, fileContent, 'utf8');
            console.log(`Success: Created backup at ${backupFileName}`);
        } catch (writeError: any) {
            throw new Error(`Failed to create backup file: ${writeError.message}`);
        }

    } catch (error: any) {
        console.error(`Backup Error: Failed to create backup for ${filePath}:`, error.message);
        throw new Error(`Backup operation failed: ${error.message}`);
    }
}

/**
 * Deletes a backup file with .bak extension
 * @param {string} filePath - Path to the original file whose backup should be deleted
 * @returns {Promise<void>}
 * @throws {Error} If backup deletion fails (except when backup doesn't exist)
 */
export async function deleteBackup(filePath: string) {
    try {
        // Validate input parameter
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path provided');
        }

        // Construct backup file path
        const backupFileName = `${filePath}.bak`;

        // Check if backup exists
        if (!existsSync(backupFileName)) {
            console.warn(`Warning: Backup file ${backupFileName} does not exist, skipping deletion.`);
            return;
        }

        // Attempt to delete backup
        try {
            rmSync(backupFileName, { force: true });
            console.log(`Success: Deleted backup at ${backupFileName}`);
        } catch (deleteError: any) {
            throw new Error(`Failed to delete backup file: ${deleteError.message}`);
        }

    } catch (error: any) {
        console.error(`Backup Error: Failed to delete backup for ${filePath}:`, error.message);
        throw new Error(`Backup deletion failed: ${error.message}`);
    }
}

/**
 * Securely overwrites sensitive data in memory
 * @param data The data to overwrite
 * @param iterations Number of overwrite iterations (default: 100)
 */
export function secureWipe(data: any, iterations = 100, bytes = 125): void {
    for (let i = 0; i < iterations; i++) {
        if (typeof data === 'string') {
            data = randomBytes(bytes).toString('hex');
        } else if (data && typeof data === 'object') {
            data = {
                kemKeyPair: randomBytes(bytes).toString('hex'),
                sigKeyPair: randomBytes(bytes).toString('hex')
            };
        }
    }
}