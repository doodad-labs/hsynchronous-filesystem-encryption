import { readFileSync, writeFileSync, rmSync } from 'fs';
import { encrypt, decrypt } from 'hsynchronous/dist/index';
import { join } from 'path';

export async function encryptCompressVirtualDrive(keypair, ZIP_FILE) {

    const zipFile = join(__dirname, '../', ZIP_FILE)

    const data = readFileSync(zipFile, 'utf8');
    rmSync(zipFile, { force: true });
    const encryptedData = await encrypt(data, await keypair);
    const encryptedFilePath = join(__dirname, '../', 'encrypted');
    writeFileSync(encryptedFilePath, encryptedData);
}

export async function decryptVirtualDrive(keypair, ZIP_FILE) {

    const zipFile = join(__dirname, '../', ZIP_FILE)

    const encryptedFilePath = join(__dirname, '../', 'encrypted');
    const encryptedData = readFileSync(encryptedFilePath, 'utf8');
    const decryptedData = await decrypt(encryptedData, await keypair);
    writeFileSync(zipFile, decryptedData.message);
}