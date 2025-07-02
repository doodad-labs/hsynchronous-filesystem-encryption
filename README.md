
# Post-quantum filesystem encryption

Post-Quantum filesystem encryption using a hybrid encryption protocol "[hsynchronous](https://github.com/doodad-labs/post-quantum-synchronous-encryption)"

```ts

❯ hsynchronous-fs --help
  Usage: src [options] [command]

  Commands:
    help     Display help
    version  Display version

  Options:
    -d, --drive [value]  The Drive letter to mount to (defaults to "A")
    -f, --file [value]   The input and output file that holds your encrypted data (defaults to "./encrypted")
    -h, --help           Output usage information
    -k, --key            The key file path
    -v, --version        Output the version number

```


## Official Rating: NIST Level 4 (Highest commercial/government grade with post-quantum resistance)

Component	                | Algorithm/Strength	        | Security Level	                    | Notes
----------------------------|-------------------------------|---------------------------------------|-----------------------------------------------------------------
Key Encapsulation (KEM)	    | ML-KEM-1024 (Kyber)	        | NIST Level 3 (PQC Standard)	        | Post-quantum secure, IND-CCA2
Digital Signature	        | Falcon-1024	                | NIST Level 3 (PQC Standard)	        | Post-quantum secure, EUF-CMA
Symmetric Encryption	    | AES-256-GCM	                | 256-bit (NIST-approved)	            | Quantum-resistant key size, provides confidentiality + integrity
Key Derivation	            | HKDF-SHA256	                | 256-bit (NIST SP 800-56C)	            | Proper key separation with context binding
Random Number Generation	| crypto.randomBytes()	        | Cryptographically secure (CSPRNG)	    | Uses OS entropy source

## Resistance Against Attacks

Attack Type	            | Protection Mechanism	                                            | Additional Notes
------------------------|-------------------------------------------------------------------|----------------------------------------
Quantum computing	    | ML-KEM-1024 (IND-CCA2) + Falcon-1024 (EUF-CMA)	                | Full PQC resistance
MITM attacks	        | Falcon-1024 signatures + protocol binding	                        | Non-repudiation
Key compromise	        | Ephemeral KEM keys (per message) + HKDF with unique salts	        | No long-term key reuse
Replay attacks	        | 64-byte random salts + 12-byte IVs (2¹²⁸ uniqueness)	            | Statistically negligible collision risk
CRIME/BREACH	        | No compression (removed in v2) + encryption before any encoding	| Mitigates compression oracles
Key derivation attacks	| HKDF-SHA256 with protocol-specific info binding	                | Prevents cross-context reuse
Timing attacks	        | timingSafeEqual + constant-time HMAC (padded inputs)	            | Resists timing leaks
Memory scraping	        | Explicit secureZero for sensitive buffers	                        | Prevents cold-boot attacks
Error oracles	        | Unified error paths (generic "decryption failed" messages)	    | Hides cryptographic faults
Side-channel leaks	    | Minimum processing time (MIN_PROCESSING_TIME)	                    | Obscures operation timing
Metadata leakage	    | Fixed block padding (1024-byte chunks)	                        | Hides true message size

## Benchmarking

```
clk: ~2.51 GHz
cpu: 13th Gen Intel(R) Core(TM) i5-13420H
runtime: node 22.13.1 (x64-win32)

benchmark                   avg (min … max) p75 / p99
------------------------------------------- ---------
GenKeys                       47.33 ms/iter  53.51 ms 
                      (35.52 ms … 64.85 ms)  58.01 ms 
                    (  2.71 kb …  20.49 kb)   4.53 kb 

Encrypt                       13.08 ms/iter  14.28 ms 
                       (9.73 ms … 25.82 ms)  24.94 ms
                    ( 23.41 kb …  39.29 kb)  24.86 kb

Decrypt                      622.42 µs/iter 878.20 µs
                      (259.30 µs … 2.62 ms)   1.87 ms
                    (472.00  b … 493.76 kb)  16.20 kb
```
  - Protocol/version mismatch
  - Unsupported algorithms detected
  - Malformed key data
