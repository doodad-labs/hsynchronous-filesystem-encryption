import { platform } from 'os';
import { exec } from 'child_process';
import { existsSync, mkdirSync, rmSync, createWriteStream } from 'fs';
import { decryptVirtualDrive } from './cryptography';
import { promisify } from 'util';
import { join } from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { extract, archiveFolder } from 'zip-lib';

const execAsync = promisify(exec);

/**
 * Unmounts a virtual drive based on the operating system
 * @param {string} DRIVE_LETTER - The drive letter to unmount (Windows)
 * @throws Will throw an error if unmounting fails or platform is unsupported
 */
export async function unmountVirtualDrive(DRIVE_LETTER) {
    const os = platform();

    try {
        if (os === 'win32') {
            // Windows: Remove the subst drive mapping
            const command = `subst ${DRIVE_LETTER}: /D`;
            await execAsync(command);
            console.log(`Virtual drive ${DRIVE_LETTER}: unmounted successfully`);
        } else {
            throw new Error(`Unsupported platform: ${os}`);
        }
    } catch (error) {
        console.error('Error unmounting virtual drive:', error.message);
        throw new Error(`Failed to unmount virtual drive: ${error.message}`);
    }
}

/**
 * Creates a virtual drive based on the operating system
 * @param {string} FOLDER_PATH - Path to the folder to mount (Windows)
 * @param {string} DRIVE_LETTER - Drive letter to assign (Windows)
 * @throws Will throw an error if creation fails or platform is unsupported
 */
export async function createVirtualDrive(FOLDER_PATH, DRIVE_LETTER, ENCRYPTED_FILE, ZIP_FILE, KEYPAIR) {
    const os = platform();

    const fullPath = join(__dirname, '../', FOLDER_PATH);
    const encryptedFilePath = join(__dirname, '../', ENCRYPTED_FILE);
    const zipFilePath = join(__dirname, '../', ZIP_FILE);

    // does the encrypted file exist?
    if (existsSync(encryptedFilePath)) {
        await decryptVirtualDrive(KEYPAIR, ZIP_FILE, ENCRYPTED_FILE);

        // does the zip file exist?
        if (!existsSync(zipFilePath)) {
            throw new Error(`Zip file ${ZIP_FILE} does not exist after decryption`);
        }

        // remove the encrypted file
        rmSync(encryptedFilePath, { force: true });

        // unzip the file
        await extract(zipFilePath, fullPath)
        

        // remove the zip file
        rmSync(zipFilePath, { force: true });
    }

    if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`Created folder at ${FOLDER_PATH}`);
    }

    try {
        if (os === 'win32') {
            // Windows: Use subst to map a folder as a virtual drive
            
            const command = `subst ${DRIVE_LETTER}: "${fullPath}"`;
            await execAsync(command);
            console.log(`Virtual drive ${DRIVE_LETTER}: created and mounted at ${fullPath}`);
        } else {
            throw new Error(`Unsupported platform: ${os}`);
        }
    } catch (error) {
        console.error('Error creating virtual drive:', error.message);
        throw new Error(`Failed to create virtual drive: ${error.message}`);
    }
}

/**
 * Deletes a virtual drive folder and its contents
 * @param {string} FOLDER_PATH - Path to the folder to delete
 * @throws Will throw an error if deletion fails
 */
export async function deleteVirtualDrive(FOLDER_PATH) {
    try {
        const fullPath = join(__dirname, '../', FOLDER_PATH);
        if (!existsSync(fullPath)) {
            console.warn(`Folder ${fullPath} does not exist, skipping deletion`);
            return;
        }
        rmSync(fullPath, { recursive: true, force: true });
        console.log(`Successfully deleted virtual drive at ${fullPath}`);
    } catch (error) {
        console.error('Error deleting virtual drive:', error.message);
        throw new Error(`Failed to delete virtual drive: ${error.message}`);
    }
}

/**
 * Opens the virtual drive in the system's file explorer
 * @param {string} DRIVE_LETTER - Drive letter to open (Windows)
 * @throws Will throw an error if opening fails or platform is unsupported
 */
export async function openVirtualDrive(DRIVE_LETTER) {
    const os = platform();
    
    try {
        if (os === 'win32') {
            // Windows: Open the virtual drive in File Explorer
            await execAsync(`start ${DRIVE_LETTER}:`);
            console.log(`Opened virtual drive ${DRIVE_LETTER}: in File Explorer`);
        } else {
            throw new Error(`Unsupported platform: ${os}`);
        }
    } catch (error) {
        console.error('Error opening virtual drive:', error.message);
        throw new Error(`Failed to open virtual drive: ${error.message}`);
    }
}

/**
 * Compresses a virtual drive folder into a ZIP file
 * @param {string} ZIP_FILE - Name of the output ZIP file
 * @param {string} FOLDER_PATH - Path to the folder to compress
 * @returns {Promise<number>} Resolves with 1 on success
 * @throws Will throw an error if compression fails
 */
export async function compressVirtualDrive(ZIP_FILE, FOLDER_PATH) {

    const zipFile = join(__dirname, '../', ZIP_FILE);
    const vdDir = join(__dirname, '../', FOLDER_PATH);

    if (!existsSync(vdDir)) {
        throw new Error(`Source folder ${vdDir} does not exist`);
    }

    await archiveFolder(vdDir, zipFile, {
        compressionLevel: 9
    });

    /* return new Promise(async (resolve, reject) => {
        try {
            

            

            const output = createWriteStream(zipFile);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression level
            });

            // Event handlers for the archive process
            output.on('close', () => {
                console.log(`Archive created successfully at ${zipFile}, ${archive.pointer()} total bytes`);
                resolve(1);
            });

            output.on('end', () => {
                console.log('Data has been drained');
            });

            archive.on('warning', (err) => {
                if (err.code === 'ENOENT') {
                    console.warn('Archive warning:', err.message);
                } else {
                    console.error('Archive warning:', err.message);
                    reject(err);
                }
            });

            archive.on('error', (err) => {
                console.error('Archive error:', err.message);
                reject(err);
            });

            // Pipe archive data to the output file
            archive.pipe(output);

            // Add directory contents to archive
            archive.directory(vdDir, false);

            // Finalize the archive
            archive.finalize();

        } catch (error) {
            console.error('Error in compressVirtualDrive:', error.message);
            reject(new Error(`Failed to compress virtual drive: ${error.message}`));
        }
    }); */
}