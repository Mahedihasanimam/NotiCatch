import { DEFAULT_SETTINGS, toCaptureConfig, useSettings } from '../settings';

beforeEach(() => useSettings.setState({ ...DEFAULT_SETTINGS }));

describe('settings store', () => {
  it('toggles excluded packages without duplicates', () => {
    useSettings.getState().toggleExcluded('a');
    useSettings.getState().toggleExcluded('b');
    useSettings.getState().toggleExcluded('a');
    expect(useSettings.getState().excludedPackages).toEqual(['b']);
    useSettings.getState().setExcluded(['x', 'x', 'y']);
    expect(useSettings.getState().excludedPackages).toEqual(['x', 'y']);
  });

  it('maps settings to the native capture config', () => {
    useSettings.getState().update({ retentionDays: 30, captureOngoing: true });
    expect(toCaptureConfig(useSettings.getState())).toMatchObject({ retentionDays: 30, captureOngoing: true, captureEnabled: true });
    useSettings.getState().update({ retentionDays: null });
    expect(toCaptureConfig(useSettings.getState()).retentionDays).toBe(0);
  });

  it('keeps onboarding state when resetting', () => {
    useSettings.getState().update({ theme: 'light', retentionDays: 7 });
    useSettings.getState().reset();
    expect(useSettings.getState()).toMatchObject({ theme: 'dark', retentionDays: null, onboarded: true });
  });
});
