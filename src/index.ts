import { importKeys, VERSION } from 'hsynchronous/dist/index';
import { encryptCompressVirtualDrive } from './cryptography';
import { cleanup, loadKey, createBackup, secureWipe, deleteBackup } from './utils';
import {
    createVirtualDrive,
    unmountVirtualDrive,
    openVirtualDrive,
    deleteVirtualDrive,
    compressVirtualDrive
} from './filesystem';
import args from 'args';


args
    .option('drive', 'The Drive letter to mount to', 'A')
    .option('key', 'The key file path')
    .option('file', 'The input and output file that holds your encrypted data', './encrypted')

const flags = args.parse(process.argv)

// Configuration Constants
const CONFIG = {
    DRIVE_LETTER: flags.drive.toUpperCase().replace(':', '') || 'A',               // Windows drive letter
    MOUNT_FOLDER_PATH: './tmp',      // Folder to mount as virtual drive
    ZIP_FILE_NAME: 'tmp.zip',        // Compressed archive filename
    KEY_FILE_PATH: flags.key || './key.txt',      // Path to encryption key file
    ENCRYPTED_FILE_PATH: flags.file || './encrypted' // Path for encrypted output
};

/**
 * Initializes and manages the virtual drive lifecycle
 */
async function manageVirtualDrive() {
    
    console.log('');
    console.log(`  __QQ   \x1b[1m hsynchronous ${VERSION}\x1b[0m`);
    console.log(` (_)_\x1b[31m"\x1b[0m>   Post-Quantum Filesystem Encryption`);
    console.log(`_)       \x1b[2m github.com/doodad-labs\x1b[0m`);
    console.log('');

    // Validate configuration
    if (!CONFIG.DRIVE_LETTER || !CONFIG.MOUNT_FOLDER_PATH || !CONFIG.ZIP_FILE_NAME || !CONFIG.KEY_FILE_PATH || !CONFIG.ENCRYPTED_FILE_PATH) {
        console.error('Error: Missing required configuration parameters.');
        process.exit(1);
    }

    // Ensure Drive Letter is valid
    if (!/^[A-Z]$/.test(CONFIG.DRIVE_LETTER)) {
        console.error(`Error: Invalid drive letter (${CONFIG.DRIVE_LETTER}). Use format like "C:", "D:", etc.`);
        process.exit(1);
    }

    await cleanup(
        CONFIG.DRIVE_LETTER,
        CONFIG.MOUNT_FOLDER_PATH,
        CONFIG.ZIP_FILE_NAME
    );

    // Initialize encryption keys
    let encryptionKey = await loadKey(CONFIG.KEY_FILE_PATH);
    secureWipe(encryptionKey);
    let keyPair = await importKeys(encryptionKey);

    createBackup(CONFIG.ENCRYPTED_FILE_PATH)
    console.log('\x1b[41mDO NOT TERMINATE OR CLOSE THIS PROCESS WITHOUT UNMOUNTING, \x1b[1mYOU WILL LOSE ALL DATA.\x1b[0m');

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

        deleteBackup(CONFIG.ENCRYPTED_FILE_PATH);

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