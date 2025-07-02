import type { kem, sign } from 'pqclean';

export interface KeyPair {
    kemKeyPair: kem.GenerateKeyPairResult;
    sigKeyPair: sign.GenerateKeyPairResult;
}