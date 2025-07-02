import { importKeys, VERSION } from 'hsynchronous/dist/index';
import { encryptCompressVirtualDrive } from './cryptography';
import { cleanup, loadKey } from './utils';
import { randomBytes } from 'crypto';
import {
    createVirtualDrive,
    unmountVirtualDrive,
    openVirtualDrive,
    deleteVirtualDrive,
    compressVirtualDrive
} from './filesystem';

// Configuration Constants
const CONFIG = {
    DRIVE_LETTER: 'A',               // Windows drive letter
    MOUNT_FOLDER_PATH: './tmp',      // Folder to mount as virtual drive
    ZIP_FILE_NAME: 'tmp.zip',        // Compressed archive filename
    KEY_FILE_PATH: './key.txt',      // Path to encryption key file
    ENCRYPTED_FILE_PATH: './encrypted' // Path for encrypted output
};

/**
 * Securely overwrites sensitive data in memory
 * @param data The data to overwrite
 * @param iterations Number of overwrite iterations (default: 100)
 */
function secureWipe(data: any, iterations = 100, bytes = 125): void {
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

/**
 * Initializes and manages the virtual drive lifecycle
 */
async function manageVirtualDrive() {
    
    console.log('');
    console.log(`  __QQ    \x1b[1mhsynchronous ${VERSION}\x1b[0m`);
    console.log(` (_)_\x1b[31m"\x1b[0m>   Post-Quantum Filesystem Encryption`);
    console.log(`_)        \x1b[2mgithub.com/doodad-labs\x1b[0m`);
    console.log('');

    await cleanup(
        CONFIG.DRIVE_LETTER,
        CONFIG.MOUNT_FOLDER_PATH,
        CONFIG.ZIP_FILE_NAME
    );

    console.log('\x1b[41mDO NOT TERMINATE OR CLOSE THIS PROCESS WITHOUT UNMOUNTING, \x1b[1mYOU WILL LOSE ALL DATA.\x1b[0m');

    // Initialize encryption keys
    let encryptionKey = await loadKey(CONFIG.KEY_FILE_PATH);
    secureWipe(encryptionKey);
    let keyPair = await importKeys(encryptionKey);

    // Create and mount the virtual drive
    await createVirtualDrive(
        CONFIG.MOUNT_FOLDER_PATH,
        CONFIG.DRIVE_LETTER,
        CONFIG.ENCRYPTED_FILE_PATH,
        CONFIG.ZIP_FILE_NAME,
        keyPair
    );
    secureWipe(keyPair);

    await openVirtualDrive(CONFIG.DRIVE_LETTER);

    // Wait for user input to unmount
    console.log('\x1b[1mPress Enter to unmount and encrypt the virtual drive...\x1b[0m');
    
    process.stdin.once('data', async () => {
        await unmountVirtualDrive(CONFIG.DRIVE_LETTER);
        await compressVirtualDrive(CONFIG.ZIP_FILE_NAME, CONFIG.MOUNT_FOLDER_PATH);
        await deleteVirtualDrive(CONFIG.MOUNT_FOLDER_PATH);

        console.log('Virtual drive unmounted and compressed. Now encrypting...');

        // Reload keys for final encryption
        encryptionKey = await loadKey(CONFIG.KEY_FILE_PATH);
        secureWipe(encryptionKey);
        keyPair = await importKeys(encryptionKey);

        await encryptCompressVirtualDrive(keyPair, CONFIG.ZIP_FILE_NAME);
        secureWipe(keyPair);

        process.exit(0);
    });
}

// Process cleanup handler
process.on('exit', async () => {
    console.log('Cleaning up...');
    await cleanup(
        CONFIG.DRIVE_LETTER,
        CONFIG.MOUNT_FOLDER_PATH,
        CONFIG.ZIP_FILE_NAME
    );
});

// Main execution
manageVirtualDrive().catch((error) => {
    console.error('Script error:', error.message);
    process.exit(1);
});