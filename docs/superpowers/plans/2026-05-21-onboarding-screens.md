# Onboarding Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5-slide onboarding carousel shown once on first launch, explaining game mechanics, with a "How to Play" replay option in Settings.

**Architecture:** A `hasSeenOnboarding` boolean is read from AsyncStorage inside `AuthContext.init()` alongside the existing guest flag, so it's ready before the navigator mounts. `AppNavigator` in `App.js` uses it to set `initialRoute` to `Onboarding` on first launch. `OnboardingScreen` is a horizontal `FlatList` with `pagingEnabled`, overlay arrow buttons, dot indicators, skip button, and a "Get Started" button on the last slide.

**Tech Stack:** React Native `FlatList` (pagingEnabled), `expo-linear-gradient`, `@react-native-async-storage/async-storage`, existing `TreeComponent`, `colors`, `fonts`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `context/AuthContext.js` | Modify | Add `hasSeenOnboarding` state + `markOnboardingSeen()`, read flag in `init()` |
| `screens/OnboardingScreen.js` | Create | All 5 slides, navigation, skip, dots, lifeline rows |
| `App.js` | Modify | Import `OnboardingScreen`, add route, update `initialRoute` logic |
| `screens/SettingsScreen.js` | Modify | Add "How to Play" button |
| `__tests__/onboarding.test.js` | Create | Tests for `markOnboardingSeen` and `hasSeenOnboardingStored` |

---

## Task 1: Add onboarding flag utilities and tests

**Files:**
- Modify: `context/AuthContext.js`
- Create: `__tests__/onboarding.test.js`

### Step 1.1: Write the failing tests

Create `__tests__/onboarding.test.js`:

```js
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
```

### Step 1.2: Run tests to confirm they fail

```bash
npx jest __tests__/onboarding.test.js --no-coverage
```

Expected: FAIL — `markOnboardingSeen`, `hasSeenOnboardingStored`, `ONBOARDING_KEY` are not exported.

### Step 1.3: Add exports and state to AuthContext

In `context/AuthContext.js`, make these changes:

**After the `GUEST_MODE_FLAG` constant (line 10), add:**
```js
export const ONBOARDING_KEY = '@mytree_has_seen_onboarding';
export const hasSeenOnboardingStored = async () => {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
};
export const markOnboardingSeen = () => AsyncStorage.setItem(ONBOARDING_KEY, 'true');
```

**Inside `AuthProvider`, add a new state after the `session` state (line 45):**
```js
const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
```

**At the very top of `init()` (before the `isSupabaseConfigured()` check, line 52), add:**
```js
const seen = await hasSeenOnboardingStored();
setHasSeenOnboarding(seen);
```

**In the `value` object (around line 141), add both new exports:**
```js
const value = {
  mode,
  user,
  session,
  hasSeenOnboarding,
  markOnboardingSeen: async () => {
    await markOnboardingSeen();
    setHasSeenOnboarding(true);
  },
  continueAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signOut,
};
```

> Note: The context's `markOnboardingSeen` is a wrapper that also updates state so `hasSeenOnboarding` goes `true` immediately — though this doesn't affect navigation since `OnboardingScreen` calls `navigation.replace` right after.

### Step 1.4: Run tests to confirm they pass

```bash
npx jest __tests__/onboarding.test.js --no-coverage
```

Expected: PASS — all 3 tests green.

### Step 1.5: Commit

```bash
git add context/AuthContext.js __tests__/onboarding.test.js
git commit -m "feat: add hasSeenOnboarding flag to AuthContext"
```

---

## Task 2: Create OnboardingScreen

**Files:**
- Create: `screens/OnboardingScreen.js`

### Step 2.1: Create the file

Create `screens/OnboardingScreen.js` with the full content below. Read it carefully — all slide data, layout, and navigation logic lives here.

```js
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TreeComponent from '../components/TreeComponent';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

const ONBOARDING_SLIDES = [
  { score: 0, caption: 'Your tree starts at 0.' },
  { score: 1, caption: 'When you get a question right, your tree grows.' },
  {
    score: 3,
    caption:
      "Depending on the difficulty you choose, wrong answers might make your tree shrink. You'll pick your level after you log in.",
  },
  { score: 5, caption: 'You grow a full tree when you get 5 correct questions in a row.' },
  { score: 5, showLifelines: true },
];

const LIFELINES = [
  {
    label: '50/50',
    name: '50/50',
    description: '2 of the wrong choices will be removed',
  },
  {
    label: '[ ]',
    name: 'Infographics',
    description: "We'll show an infographic that could help you",
  },
  {
    label: '( )',
    name: 'Shield',
    description: 'Your tree will not shrink for at least 1 question',
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const { markOnboardingSeen } = useAuthContext();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const returnTo = route?.params?.returnTo || 'Welcome';
  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const goToIndex = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleSkipOrFinish = async () => {
    await markOnboardingSeen();
    if (returnTo === 'Settings') {
      navigation.goBack();
    } else {
      navigation.replace('Welcome');
    }
  };

  const renderSlide = ({ item }) => (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={[styles.slide, { width }]}
    >
      <View style={[styles.slideHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.slideTitle}>My Tree</Text>
        <Text style={styles.slideTagline}>
          Answer questions about the climate to grow your virtual tree!
        </Text>
      </View>

      <View style={styles.treeArea}>
        <TreeComponent score={item.score} showGround={false} />
      </View>

      {item.showLifelines ? (
        <View style={styles.lifelineContainer}>
          {LIFELINES.map((lifeline) => (
            <View key={lifeline.name} style={styles.lifelineRow}>
              <View style={styles.lifelineIcon}>
                <Text style={styles.lifelineIconText}>{lifeline.label}</Text>
              </View>
              <View style={styles.lifelineText}>
                <Text style={styles.lifelineName}>{lifeline.name}</Text>
                <Text style={styles.lifelineDesc}>{lifeline.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.caption}>{item.caption}</Text>
      )}
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Skip button — slides 1–4 only */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={handleSkipOrFinish}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Prev arrow */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={styles.prevArrow}
          onPress={() => goToIndex(currentIndex - 1)}
        >
          <Text style={styles.arrowText}>◄</Text>
        </TouchableOpacity>
      )}

      {/* Next arrow — slides 1–4 only */}
      {!isLast && (
        <TouchableOpacity
          style={styles.nextArrow}
          onPress={() => goToIndex(currentIndex + 1)}
        >
          <Text style={styles.arrowText}>►</Text>
        </TouchableOpacity>
      )}

      {/* Bottom: dots or Get Started */}
      {isLast ? (
        <TouchableOpacity
          style={[styles.getStartedButton, { marginBottom: insets.bottom + 24 }]}
          onPress={handleSkipOrFinish}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.dotsRow, { marginBottom: insets.bottom + 24 }]}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 28,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  slideTagline: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },

  treeArea: {
    flex: 1,
    justifyContent: 'center',
  },

  caption: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
    lineHeight: 20,
    paddingHorizontal: 8,
    marginTop: 12,
  },

  lifelineContainer: {
    marginTop: 12,
    gap: 12,
  },
  lifelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lifelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifelineIconText: {
    fontSize: 10,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  lifelineText: { flex: 1 },
  lifelineName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.black,
  },
  lifelineDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },

  skipButton: {
    position: 'absolute',
    right: 20,
  },
  skipText: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: fonts.semiBold,
  },

  prevArrow: {
    position: 'absolute',
    left: 8,
    top: '45%',
    padding: 8,
  },
  nextArrow: {
    position: 'absolute',
    right: 8,
    top: '45%',
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    color: colors.primaryGreen,
  },

  dotsRow: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayLight,
  },
  dotActive: {
    backgroundColor: colors.primaryGreen,
  },

  getStartedButton: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 25,
  },
  getStartedText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
```

### Step 2.2: Verify the file saved

```bash
head -5 screens/OnboardingScreen.js
```

Expected output:
```
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
```

### Step 2.3: Commit

```bash
git add screens/OnboardingScreen.js
git commit -m "feat: add OnboardingScreen with 5 slides"
```

---

## Task 3: Wire routing in App.js

**Files:**
- Modify: `App.js`

### Step 3.1: Add the import and update AppNavigator

In `App.js`, make two changes:

**1. Add the import after the existing screen imports (after line 24):**
```js
import OnboardingScreen from './screens/OnboardingScreen';
```

**2. Update `AppNavigator` to read `hasSeenOnboarding` and compute `initialRoute`:**

Replace:
```js
function AppNavigator() {
  const { mode } = useAuthContext();

  if (mode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  const initialRoute = mode === 'welcome' ? 'Welcome' : 'Home';
```

With:
```js
function AppNavigator() {
  const { mode, hasSeenOnboarding } = useAuthContext();

  if (mode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  let initialRoute;
  if (!hasSeenOnboarding) {
    initialRoute = 'Onboarding';
  } else if (mode === 'welcome') {
    initialRoute = 'Welcome';
  } else {
    initialRoute = 'Home';
  }
```

**3. Add the `Onboarding` screen to the Stack Navigator, after the `Welcome` screen entry:**
```js
<Stack.Screen name="Onboarding" component={OnboardingScreen} />
```

### Step 3.2: Run the full test suite to confirm nothing is broken

```bash
npm test -- --no-coverage
```

Expected: all existing tests pass.

### Step 3.3: Commit

```bash
git add App.js
git commit -m "feat: route to OnboardingScreen on first launch"
```

---

## Task 4: Add "How to Play" to SettingsScreen

**Files:**
- Modify: `screens/SettingsScreen.js`

### Step 4.1: Add the handler and button

In `SettingsScreen.js`, make two changes:

**1. Add a handler after `handleSignIn` (around line 91):**
```js
const handleHowToPlay = () => {
  navigation.navigate('Onboarding', { returnTo: 'Settings' });
};
```

**2. Add the button to the `ScrollView` body. Insert it before the closing `</ScrollView>` tag — it should appear for both auth and guest users. Add it after the last conditional block (after the `</>` that closes the ternary, around line 145):**
```jsx
<TouchableOpacity style={styles.button} onPress={handleHowToPlay}>
  <Text style={styles.buttonText}>How to Play</Text>
</TouchableOpacity>
```

### Step 4.2: Run the full test suite

```bash
npm test -- --no-coverage
```

Expected: all tests pass.

### Step 4.3: Commit

```bash
git add screens/SettingsScreen.js
git commit -m "feat: add How to Play button to SettingsScreen"
```

---

## Task 5: Manual verification

### Step 5.1: Start the dev server

```bash
npx expo start --web
```

Open `http://localhost:8081` in a browser.

### Step 5.2: First-launch test

- Clear AsyncStorage by opening browser DevTools → Application → Local Storage → clear `http://localhost:8081`
- Reload the page
- Expected: Onboarding screen appears (slide 1, tree at score 0, "Your tree starts at 0.")

### Step 5.3: Slide navigation test

- Tap `►` arrow → slide 2 appears, tree grows, dot indicator advances
- Tap `►` again → slide 3, longer caption
- Tap `◄` → back to slide 2
- Swipe left (click-drag on web) to advance slides
- Reach slide 4 → "You grow a full tree…" caption
- Reach slide 5 → lifeline rows visible, no skip button, "Get Started" button appears

### Step 5.4: Skip test

- Reload, clear storage again
- On slide 2, tap "Skip" → lands on Welcome screen
- Reload without clearing storage → Welcome screen appears directly (onboarding not shown again)

### Step 5.5: Get Started test

- Clear storage, reload, navigate to slide 5, tap "Get Started"
- Expected: lands on Welcome screen, subsequent reloads skip onboarding

### Step 5.6: How to Play replay test

- From Home → Settings → "How to Play" button
- Expected: Onboarding screen opens, all 5 slides work
- Tap Skip or Get Started → returns to Settings screen (not Welcome)
