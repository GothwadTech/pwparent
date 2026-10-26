import {describe, expect, it} from 'vitest';
import {MOCK_OTP, getBackend, mockStudents, usingMockData} from '../lib/backend';

describe('backend facade', () => {
  it('runs on mock data by default so the app works with zero env', async () => {
    const backend = await getBackend();

    expect(usingMockData).toBe(true);
    expect(backend.mode).toBe('mock');
    expect(await backend.getLinkedStudents()).toEqual(mockStudents);
    expect((await backend.getAnnouncements()).length).toBeGreaterThan(0);
    expect((await backend.getPurchases()).length).toBeGreaterThan(0);

    const profile = await backend.getParentProfile();
    expect(profile.mobileNumber).toMatch(/^\d{10}$/);
  });

  it('mock OTP flow accepts the demo code and rejects anything else', async () => {
    const backend = await getBackend();

    const sent = await backend.sendOtp('9335010032');
    expect(sent.mode).toBe('mock');
    expect(sent.notice).toContain(MOCK_OTP);

    const bad = await backend.verifyOtp('000000', sent);
    expect(bad.ok).toBe(false);
    expect(bad.error).toBeTruthy();

    const good = await backend.verifyOtp(MOCK_OTP, sent);
    expect(good.ok).toBe(true);
    expect(good.uid).toBeTruthy();
  });

  it('caches the resolved backend (no repeated lazy imports)', async () => {
    const first = await getBackend();
    const second = await getBackend();

    expect(second).toBe(first);
  });
});
