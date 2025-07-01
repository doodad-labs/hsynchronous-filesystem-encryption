import { platform } from 'os';
import { exec } from 'child_process';
import { existsSync, mkdirSync, rmSync, createWriteStream } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import archiver from 'archiver';

const execAsync = promisify(exec);

export async function unmountVirtualDrive(DRIVE_LETTER, MOUNT_PATH) {
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

export async function createVirtualDrive(FOLDER_PATH, DRIVE_LETTER, MOUNT_PATH, IMAGE_PATH, IMAGE_SIZE_MB) {
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

export async function deleteVirtualDrive(FOLDER_PATH) {
    await rmSync(join(__dirname, '../', FOLDER_PATH), { recursive: true, force: true });
}

export async function openVirtualDrive(DRIVE_LETTER, MOUNT_PATH) {
    const os = platform();
    try {
        if (os === 'win32') {
            // Windows: Open the virtual drive in File Explorer
            await execAsync(`start ${DRIVE_LETTER}:`);
        } else if (os === 'linux') {
            // Linux: Open the mount point in the file manager
            await execAsync(`xdg-open ${MOUNT_PATH}`);
        }

    } catch (error) {
        console.error('Error opening virtual drive:', error.message);
        process.exit(1);
    }
}

export async function compressVirtualDrive(ZIP_FILE, FOLDER_PATH) {

    return new Promise((resolve, reject) => {

        const zipFile = join(__dirname, '../', ZIP_FILE)
        const vdDir = join(__dirname, '../', FOLDER_PATH);

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