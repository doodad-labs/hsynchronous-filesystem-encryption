import { execSync, exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
import { existsSync, mkdirSync, createWriteStream, rmSync, readFileSync, writeFileSync } from 'fs';
import { encrypt, decrypt, importKeys } from 'hsynchronous/dist/index';
import key from './key';
import { join } from 'path';
import archiver from 'archiver';

const execAsync = promisify(exec);
const keypair = importKeys(key);

// Configuration
const DRIVE_LETTER = 'A'; // Windows drive letter
const MOUNT_PATH = '/mnt/virtual'; // Linux mount point
const IMAGE_PATH = './virtualDrive.img'; // Linux disk image file
const FOLDER_PATH = './virtualDriveFolder'; // Windows folder to mount
const IMAGE_SIZE_MB = 100; // Size in MB for Linux virtual disk

const zipFile = join(__dirname, '../', 'compressed.zip')
const vdDir = join(__dirname, '../', FOLDER_PATH);

async function createVirtualDrive() {
    const os = platform();

    try {
        if (os === 'win32') {
            // Windows: Use subst to map a folder as a virtual drive
            if (!existsSync(FOLDER_PATH)) {
                mkdirSync(FOLDER_PATH);
                console.log(`Created folder at ${FOLDER_PATH}`);
            }
            const command = `subst ${DRIVE_LETTER}: ${FOLDER_PATH}`;
            await execAsync(command);
            console.log(`Virtual drive ${DRIVE_LETTER}: created and mounted at ${FOLDER_PATH}`);
        } else if (os === 'linux') {
            // Linux: Create a disk image and mount it
            if (!existsSync(MOUNT_PATH)) {
                mkdirSync(MOUNT_PATH, { recursive: true });
                console.log(`Created mount point at ${MOUNT_PATH}`);
            }
            if (!existsSync(IMAGE_PATH)) {
                // Create a 100MB disk image
                await execAsync(`dd if=/dev/zero of=${IMAGE_PATH} bs=1M count=${IMAGE_SIZE_MB}`);
                // Format as ext4
                await execAsync(`mkfs.ext4 ${IMAGE_PATH}`);
                console.log(`Created and formatted disk image at ${IMAGE_PATH}`);
            }
            // Mount the image
            await execAsync(`sudo mount -o loop ${IMAGE_PATH} ${MOUNT_PATH}`);
            console.log(`Virtual drive mounted at ${MOUNT_PATH}`);
        } else {
            throw new Error('Unsupported platform: ' + os);
        }
    } catch (error) {
        console.error('Error creating virtual drive:', error.message);
        process.exit(1);
    }
}

async function openVirtualDrive() {
    const os = platform();
    try {
        if (os === 'win32') {
            // Windows: Open the virtual drive in File Explorer
            execSync(`start ${DRIVE_LETTER}:`);
        } else if (os === 'linux') {
            // Linux: Open the mount point in the file manager
            execSync(`xdg-open ${MOUNT_PATH}`);
        }

    } catch (error) {
        console.error('Error opening virtual drive:', error.message);
        process.exit(1);
    }
}

async function unmountVirtualDrive() {
    const os = platform();

    try {
        if (os === 'win32') {
            // Windows: Remove the subst drive
            const command = `subst ${DRIVE_LETTER}: /D`;
            await execAsync(command);
            console.log(`Virtual drive ${DRIVE_LETTER}: unmounted`);
        } else if (os === 'linux') {
            // Linux: Unmount the disk image
            await execAsync(`sudo umount ${MOUNT_PATH}`);
            console.log(`Virtual drive unmounted from ${MOUNT_PATH}`);
        } else {
            throw new Error('Unsupported platform: ' + os);
        }
    } catch (error) {
        console.error('Error unmounting virtual drive:', error.message);
        process.exit(1);
    }
}

async function deleteVirtualDrive() {
    await rmSync(join(__dirname, '../', FOLDER_PATH), { recursive: true, force: true });
}

async function encryptCompressVirtualDrive() {
    const data = readFileSync(zipFile, 'hex');
    rmSync(zipFile, { force: true });
    const encryptedData = await encrypt(data, await keypair);
    const encryptedFilePath = join(__dirname, '../', 'encrypted');
    writeFileSync(encryptedFilePath, encryptedData);
}

async function decryptVirtualDrive() {
    const encryptedFilePath = join(__dirname, '../', 'encrypted');
    const encryptedData = readFileSync(encryptedFilePath, 'hex');
    const decryptedData = await decrypt(encryptedData, await keypair);
    writeFileSync(zipFile, decryptedData.message);
}

async function compressVirtualDrive() {

    return new Promise((resolve, reject) => {

        const output = createWriteStream(zipFile);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function () {
            resolve(1);
        });

        output.on('end', function() {
            console.log('Data has been drained');
        });

        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        archive.on('error', function(err){
            console.error('Error during archiving:', err.message);
            reject(err);
        });

        archive.pipe(output);

        archive.directory(`${vdDir}`, false);

        archive.finalize();

    })
}

async function main() {

    console.log('Starting virtual drive script...');

    // Create and mount the virtual drive
    await createVirtualDrive();
    await openVirtualDrive();

    // Prompt user to unmount
    console.log('Press Enter to unmount the virtual drive...');
    process.stdin.once('data', async () => {

        await unmountVirtualDrive();

        console.log('Encrypting and saving the virtual drive...');

        await new Promise(resolve => setTimeout(resolve, 2000));
        await compressVirtualDrive();
        await deleteVirtualDrive();
        await encryptCompressVirtualDrive();
        await decryptVirtualDrive();

        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Script error:', error.message);
    process.exit(1);
});
