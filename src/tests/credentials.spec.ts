import {describe, expect, it} from 'vitest';
import {
  CREDENTIAL_VERSION,
  PBKDF2_ITERATIONS,
  createCredential,
  isStoredCredential,
  isValidCode,
  normalizePhone,
  randomSixDigitCode,
  verifyCredential,
} from '../lib/credentials';

/**
 * Login codes replace SMS OTP. The number is the username, the 6-digit code is
 * the password, and only a PBKDF2 digest is ever persisted — so the round trip
 * and the negative cases are the security-critical part of the app.
 */
describe('credentials: the name label', () => {
  it('stores a name alongside the digest without changing verification', async () => {
    const record = await createCredential('246810', '9876543210', {name: 'Ananya Sharma'});
    expect(record.name).toBe('Ananya Sharma');
    expect(isStoredCredential(record)).toBe(true);
    // The name is a label, not part of the secret: the same code still verifies
    // and a different name would not have changed the digest inputs.
    expect(await verifyCredential('246810', '9876543210', record)).toBe(true);
    expect(await verifyCredential('111111', '9876543210', record)).toBe(false);
  });

  it('omits the key entirely when no name is given, so old docs stay identical', async () => {
    const record = await createCredential('246810', '9876543210');
    expect('name' in record).toBe(false);
  });

  it('trims the name and treats whitespace-only as absent', async () => {
    expect((await createCredential('246810', '9876543210', {name: '  Ananya  '})).name).toBe('Ananya');
    expect('name' in (await createCredential('246810', '9876543210', {name: '   '}))).toBe(false);
  });
});

describe('credentials: normalisation', () => {
  it('reducePhone strips every non-digit and any +91 / 91 / 0 prefix', () => {
    expect(normalizePhone('98765 43210')).toBe('9876543210');
    expect(normalizePhone('+91 98765-43210')).toBe('9876543210');
    expect(normalizePhone('919876543210')).toBe('9876543210');
    expect(normalizePhone('09876543210')).toBe('9876543210');
  });

  it('is a stable key: the same number in any spelling hashes identically', () => {
    expect(normalizePhone('+919876543210')).toBe(normalizePhone('9876543210'));
  });

  it('isValidCode accepts exactly 6 digits', () => {
    expect(isValidCode('123456')).toBe(true);
    expect(isValidCode('12345')).toBe(false);
    expect(isValidCode('1234567')).toBe(false);
    expect(isValidCode('12345a')).toBe(false);
    expect(isValidCode('')).toBe(false);
  });

  it('randomSixDigitCode always returns 6 digits, including a leading zero', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(randomSixDigitCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe('credentials: PBKDF2 round trip', () => {
  it('the correct code verifies', async () => {
    const stored = await createCredential('246810', '9876543210');

    expect(stored.v).toBe(CREDENTIAL_VERSION);
    expect(stored.iterations).toBe(PBKDF2_ITERATIONS);
    expect(isStoredCredential(stored)).toBe(true);
    await expect(verifyCredential('246810', '9876543210', stored)).resolves.toBe(true);
  });

  it('a wrong code does not verify', async () => {
    const stored = await createCredential('246810', '9876543210');
    await expect(verifyCredential('000000', '9876543210', stored)).resolves.toBe(false);
  });

  it('the number is mixed in as a pepper: same code, other number, fails', async () => {
    const stored = await createCredential('246810', '9876543210');
    await expect(verifyCredential('246810', '9000000000', stored)).resolves.toBe(false);
  });

  it('never stores the code, and salts differently every time', async () => {
    const a = await createCredential('246810', '9876543210');
    const b = await createCredential('246810', '9876543210');

    const serialized = JSON.stringify([a, b]);
    expect(serialized).not.toContain('246810');
    // Distinct salts mean two identical codes still produce distinct hashes,
    // so a leaked document cannot be rainbow-tabled across users.
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    // Both still verify.
    await expect(verifyCredential('246810', '9876543210', a)).resolves.toBe(true);
    await expect(verifyCredential('246810', '9876543210', b)).resolves.toBe(true);
  });

  it('rejects malformed stored records instead of throwing', async () => {
    expect(isStoredCredential(null)).toBe(false);
    expect(isStoredCredential({})).toBe(false);
    expect(isStoredCredential({v: 1, salt: 'x'})).toBe(false);

    const broken = {v: 1, salt: 'not-base64!!', iterations: 1, hash: 'x', createdAt: ''};
    await expect(verifyCredential('123456', '9876543210', broken)).resolves.toBe(false);
  });
});
