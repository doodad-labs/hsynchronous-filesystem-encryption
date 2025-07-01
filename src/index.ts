import { importKeys } from 'hsynchronous/dist/index';
import { encryptCompressVirtualDrive, decryptVirtualDrive } from './cryptography';

import { createVirtualDrive, unmountVirtualDrive, openVirtualDrive, deleteVirtualDrive, compressVirtualDrive } from './filesystem';
import key from './key';

const keypair = importKeys(key);

// Configuration
const DRIVE_LETTER = 'A'; // Windows drive letter
const MOUNT_PATH = '/mnt/virtual'; // Linux mount point
const IMAGE_PATH = './virtualDrive.img'; // Linux disk image file
const FOLDER_PATH = './virtualDriveFolder'; // Windows folder to mount
const IMAGE_SIZE_MB = 100; // Size in MB for Linux virtual disk
const ZIP_FILE = 'compressed.zip'

async function main() {

    console.log('Starting virtual drive script...');

    // Create and mount the virtual drive
    await createVirtualDrive(FOLDER_PATH, DRIVE_LETTER, MOUNT_PATH, IMAGE_PATH, IMAGE_SIZE_MB);
    await openVirtualDrive(DRIVE_LETTER, MOUNT_PATH);

    // Prompt user to unmount
    console.log('Press Enter to unmount the virtual drive...');
    
    process.stdin.once('data', async () => {

        await unmountVirtualDrive(DRIVE_LETTER, MOUNT_PATH);
        await compressVirtualDrive(ZIP_FILE, FOLDER_PATH);
        await deleteVirtualDrive(FOLDER_PATH);
        await encryptCompressVirtualDrive(keypair, ZIP_FILE);
        await decryptVirtualDrive(keypair, ZIP_FILE);

        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Script error:', error.message);
    process.exit(1);
});
