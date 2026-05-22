import AsyncStorage from '@react-native-async-storage/async-storage';
import { markOnboardingSeen, hasSeenOnboardingStored, ONBOARDING_KEY } from '../context/AuthContext';

describe('onboarding flag', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('hasSeenOnboardingStored returns false when key is absent', async () => {
    const result = await hasSeenOnboardingStored();
    expect(result).toBe(false);
  });

  it('markOnboardingSeen writes true to AsyncStorage', async () => {
    await markOnboardingSeen();
    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(stored).toBe('true');
  });

  it('hasSeenOnboardingStored returns true after markOnboardingSeen', async () => {
    await markOnboardingSeen();
    const result = await hasSeenOnboardingStored();
    expect(result).toBe(true);
  });
});
