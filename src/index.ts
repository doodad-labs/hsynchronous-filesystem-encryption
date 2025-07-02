import { importKeys } from 'hsynchronous/dist/index';
import { encryptCompressVirtualDrive, decryptVirtualDrive } from './cryptography';

import { createVirtualDrive, unmountVirtualDrive, openVirtualDrive, deleteVirtualDrive, compressVirtualDrive } from './filesystem';
import key from './key';

const KEYPAIR = importKeys(key);

// Configuration
const DRIVE_LETTER = 'A'; // Windows drive letter
const FOLDER_PATH = './virtualDriveFolder'; // Windows folder to mount
const ZIP_FILE = 'compressed.zip'
const ENCRYPTED_FILE = 'encrypted'

async function main() {

    console.log('Starting virtual drive script...');

    // Create and mount the virtual drive
    await createVirtualDrive(FOLDER_PATH, DRIVE_LETTER, ENCRYPTED_FILE, ZIP_FILE, KEYPAIR);
    await openVirtualDrive(DRIVE_LETTER);

    // Prompt user to unmount
    console.log('Press Enter to unmount the virtual drive...');
    
    process.stdin.once('data', async () => {

        await unmountVirtualDrive(DRIVE_LETTER);
        await compressVirtualDrive(ZIP_FILE, FOLDER_PATH);
        await deleteVirtualDrive(FOLDER_PATH);
        await encryptCompressVirtualDrive(KEYPAIR, ZIP_FILE);

        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Script error:', error.message);
    process.exit(1);
});
