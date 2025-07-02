import { importKeys } from 'hsynchronous/dist/index';
import { encryptCompressVirtualDrive, } from './cryptography';
import { cleanup, loadKey } from './utils';
import { randomBytes } from 'crypto';

import { createVirtualDrive, unmountVirtualDrive, openVirtualDrive, deleteVirtualDrive, compressVirtualDrive } from './filesystem';

// Configuration
const DRIVE_LETTER = 'A'; // Windows drive letter
const FOLDER_PATH = './tmp'; // Windows folder to mount
const ZIP_FILE = 'tmp.zip'
const KEYFILE = './key.txt'; // Path to the key file
const ENCRYPTED_FILE = 'encrypted'

async function main() {

    console.log('Starting virtual drive script...');

    // Create and mount the virtual drive
    let KEY = await loadKey(KEYFILE);
    let KEYPAIR = await importKeys(KEY);

    await createVirtualDrive(FOLDER_PATH, DRIVE_LETTER, ENCRYPTED_FILE, ZIP_FILE, KEYPAIR);

    // Clear the key and keypair from memory
    for (let i = 0; i < 100; i++) KEY = randomBytes(125).toString('hex');
    for (let i = 0; i < 100; i++) KEYPAIR = { kemKeyPair: randomBytes(125).toString('hex'), sigKeyPair: randomBytes(125).toString('hex') };

    await openVirtualDrive(DRIVE_LETTER);

    // Prompt user to unmount
    console.log('Press Enter to unmount and encrypt the virtual drive...');
    
    process.stdin.once('data', async () => {

        await unmountVirtualDrive(DRIVE_LETTER);
        await compressVirtualDrive(ZIP_FILE, FOLDER_PATH);
        await deleteVirtualDrive(FOLDER_PATH);

        console.log('Virtual drive unmounted and compressed. Now encrypting...');

        let KEY = await loadKey(KEYFILE);
        let KEYPAIR = await importKeys(KEY);

        await encryptCompressVirtualDrive(KEYPAIR, ZIP_FILE);

        // Clear the key and keypair from memory
        for (let i = 0; i < 100; i++) KEY = randomBytes(125).toString('hex');
        for (let i = 0; i < 100; i++) KEYPAIR = { kemKeyPair: randomBytes(125).toString('hex'), sigKeyPair: randomBytes(125).toString('hex') };

        process.exit(0);
    });
}

process.on('exit', async () => {
    console.log('Cleaning up...');
    await cleanup(DRIVE_LETTER, FOLDER_PATH, ZIP_FILE);
});

main().catch((error) => {
    console.error('Script error:', error.message);
    process.exit(1);
});
