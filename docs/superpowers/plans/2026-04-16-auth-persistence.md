# Authentication & Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest mode with AsyncStorage persistence and Supabase authentication (Apple + Google + magic link email) with auto-merge migration and account deletion.

**Architecture:** Split `AppContext` into `AuthContext` (auth state) and `GameContext` (game state). A new `StorageService` routes reads/writes to AsyncStorage (guests) or Supabase (authenticated users). Three new tables with Row Level Security. Account deletion via Supabase Edge Function.

**Tech Stack:** React Native + Expo (SDK 54), Supabase (Auth + Postgres + Edge Functions), AsyncStorage, expo-auth-session, expo-crypto.

**Reference:** See [design spec](../specs/2026-04-15-auth-persistence-design.md).

---

## Execution Phases

This plan has four phases. Each phase ends with the app in a working state.

| Phase | Description | Blocks on user? |
|-------|-------------|-----------------|
| 1 | Guest mode with AsyncStorage persistence | No |
| 2 | Supabase project setup (dashboard) | Yes — user action required |
| 3 | Wire up Supabase auth + migration + deletion | No (after Phase 2) |
| 4 | Manual testing and polish | No |

**At the end of Phase 1**, guest mode is fully functional. All existing features work, and score persists across app restarts. This is a shippable intermediate state.

**Phase 2** requires the user to perform actions in the Supabase dashboard, Apple Developer account, and Google Cloud Console. Specific steps are included below.

---

## File Structure

### Files created

| Path | Responsibility |
|------|----------------|
| `services/supabase.js` | Supabase client initialization, re-exported for use across the app |
| `services/storage.js` | StorageService — routes reads/writes between AsyncStorage (guest) and Supabase (auth) |
| `services/auth.js` | Auth helper methods (signInWithApple, signInWithGoogle, signInWithEmail, signOut) |
| `services/migration.js` | Guest-to-auth migration logic |
| `context/AuthContext.js` | Auth state provider — mode, user, session |
| `context/GameContext.js` | Renamed from AppContext, expanded to track question history |
| `screens/WelcomeScreen.js` | Auth options + guest entry |
| `screens/MagicLinkSentScreen.js` | Waiting for magic link confirmation |
| `screens/SettingsScreen.js` | Account management, sign out, account deletion |
| `supabase/schema.sql` | Initial schema — tables, RLS policies, trigger |
| `supabase/functions/delete-account/index.ts` | Edge Function for account deletion |
| `.env.example` | Documents required environment variables |
| `__tests__/storage.test.js` | Unit tests for StorageService guest mode |
| `__tests__/migration.test.js` | Unit tests for migration logic |
| `jest.config.js` | Jest configuration for Expo |

### Files modified

| Path | Change |
|------|--------|
| `App.js` | Add AuthContext provider, restructure navigation with Welcome/MagicLinkSent/Settings |
| `context/AppContext.js` | Deleted (replaced by GameContext.js) |
| `screens/HomeScreen.js` | Add gear icon for Settings navigation |
| `screens/TreeScreen.js` | Add sign-in prompt banner for guests |
| `screens/AnswerScreen.js` | Call StorageService.saveAnswer; show sign-in prompt after category completion |
| `screens/QuestionScreen.js` | Call StorageService.startSession at category start |
| `package.json` | Add new dependencies + test scripts |
| `app.json` | Add deep link scheme for magic link + OAuth callbacks |

---

# Phase 1: Guest Mode with Local Persistence

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-auth-session expo-crypto expo-web-browser
```

Expected: packages added to `package.json` under `dependencies`. `npx expo install` picks Expo-compatible versions automatically.

- [ ] **Step 2: Install dev dependencies for testing**

Run:
```bash
npm install --save-dev jest jest-expo @types/jest
```

Expected: packages added to `devDependencies`.

- [ ] **Step 3: Verify installs**

Run: `npm ls --depth=0`
Expected: All new packages listed with no peer dependency errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase, asyncstorage, and auth dependencies"
```

---

## Task 2: Configure Jest for Expo

**Files:**
- Create: `jest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Create Jest config**

Create `jest.config.js` with this content:
```javascript
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/docs/',
    '/ios/',
    '/android/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|@react-native-async-storage/.*)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
```

- [ ] **Step 2: Create Jest setup file**

Create `jest.setup.js` with:
```javascript
// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `scripts`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify Jest runs**

Run: `npm test -- --listTests`
Expected: No errors. Should report "0 tests found" since we haven't written any.

- [ ] **Step 5: Commit**

```bash
git add jest.config.js jest.setup.js package.json
git commit -m "chore: configure jest for expo"
```

---

## Task 3: Create .env.example and update .gitignore

**Files:**
- Create: `.env.example`
- Modify: `.gitignore` (verify)

- [ ] **Step 1: Create .env.example**

Create `.env.example` with:
```
# Supabase project settings - populate from your Supabase dashboard
# https://app.supabase.com/project/_/settings/api
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Note: `EXPO_PUBLIC_` prefix is required for Expo to expose these vars to the client bundle.

- [ ] **Step 2: Verify .gitignore already excludes .env**

Run: `grep "^\.env" .gitignore`
Expected: `.env` appears in .gitignore (already present in current repo).

- [ ] **Step 3: Create empty .env file for local development**

Run:
```bash
cp .env.example .env
```

The user will populate this later in Phase 2.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example for supabase config"
```

---

## Task 4: Create Supabase client

**Files:**
- Create: `services/supabase.js`

- [ ] **Step 1: Create the client module**

Create `services/supabase.js`:
```javascript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Defer validation - app should still boot in guest mode if env vars missing.
// Auth operations will fail clearly at call time if unconfigured.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Authentication will not work until these are set in .env.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);
```

- [ ] **Step 2: Verify the module parses**

Run: `node -e "require('./services/supabase.js')" 2>&1 | head -5`

Note: This will fail because it uses ES modules / React Native imports. Instead verify with:
```bash
npx expo export --platform web --dev 2>&1 | tail -20
```
Expected: Build succeeds. Warning about missing env vars is OK.

- [ ] **Step 3: Commit**

```bash
git add services/supabase.js
git commit -m "feat: add supabase client with asyncstorage session persistence"
```

---

## Task 5: Write StorageService tests (TDD)

**Files:**
- Create: `__tests__/storage.test.js`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/storage.test.js`:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, GUEST_STORAGE_KEY } from '../services/storage';

describe('StorageService (guest mode)', () => {
  const guestAuth = { mode: 'guest', user: null };

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('getScore returns 0 when no data exists', async () => {
    const svc = new StorageService(guestAuth);
    const score = await svc.getScore();
    expect(score).toBe(0);
  });

  test('updateScore persists to AsyncStorage', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(3);

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data = JSON.parse(raw);
    expect(data.score).toBe(3);
  });

  test('getScore returns persisted value', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(4);

    const svc2 = new StorageService(guestAuth);
    const score = await svc2.getScore();
    expect(score).toBe(4);
  });

  test('startSession creates a new session with generated id', async () => {
    const svc = new StorageService(guestAuth);
    const sessionId = await svc.startSession('energy');

    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe('string');
  });

  test('saveAnswer appends to current session', async () => {
    const svc = new StorageService(guestAuth);
    const sessionId = await svc.startSession('energy');
    await svc.saveAnswer(sessionId, 'energy', 1, 2, false);

    const attempts = await svc.getAnsweredQuestions('energy');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      questionId: 1,
      selectedAnswer: 2,
      isCorrect: false,
    });
  });

  test('getAnsweredQuestions returns all when no category filter', async () => {
    const svc = new StorageService(guestAuth);
    const s1 = await svc.startSession('energy');
    await svc.saveAnswer(s1, 'energy', 1, 2, false);
    const s2 = await svc.startSession('transportation');
    await svc.saveAnswer(s2, 'transportation', 1, 0, true);

    const all = await svc.getAnsweredQuestions();
    expect(all).toHaveLength(2);
  });

  test('clearAllData removes guest data', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(5);
    await svc.clearAllData();

    const score = await svc.getScore();
    expect(score).toBe(0);
  });

  test('guestId is generated on first use and persists', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(1);

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data = JSON.parse(raw);
    expect(data.guestId).toBeTruthy();

    const firstId = data.guestId;

    const svc2 = new StorageService(guestAuth);
    await svc2.updateScore(2);

    const raw2 = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data2 = JSON.parse(raw2);
    expect(data2.guestId).toBe(firstId);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/storage.test.js`
Expected: All tests fail with "Cannot find module '../services/storage'".

- [ ] **Step 3: Commit the tests**

```bash
git add __tests__/storage.test.js
git commit -m "test: add storage service guest mode tests"
```

---

## Task 6: Implement StorageService (guest mode)

**Files:**
- Create: `services/storage.js`

- [ ] **Step 1: Implement the StorageService class**

Create `services/storage.js`:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export const GUEST_STORAGE_KEY = '@mytree_guest_data';

const emptyGuestData = () => ({
  guestId: null,
  score: 0,
  sessions: [],
});

export class StorageService {
  constructor(authState) {
    this.authState = authState;
  }

  // ---- Guest storage helpers ----

  async _readGuestData() {
    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return emptyGuestData();
    try {
      return JSON.parse(raw);
    } catch {
      return emptyGuestData();
    }
  }

  async _writeGuestData(data) {
    if (!data.guestId) {
      data.guestId = Crypto.randomUUID();
    }
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  }

  // ---- Public API ----

  async getScore() {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      return data.score;
    }
    // auth mode: fetch latest score from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', this.authState.user.id)
      .single();
    if (error) throw error;
    // Score lives in app state, not profiles. Sum correct answers from attempts.
    const { data: attempts, error: err2 } = await supabase
      .from('question_attempts')
      .select('is_correct')
      .eq('user_id', this.authState.user.id);
    if (err2) throw err2;
    // Tree score = correct - incorrect, clamped to [0, 5]
    const net = attempts.reduce((acc, a) => acc + (a.is_correct ? 1 : -1), 0);
    return Math.max(0, Math.min(5, net));
  }

  async updateScore(newScore) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      data.score = newScore;
      await this._writeGuestData(data);
      return;
    }
    // auth mode: score is derived from question_attempts; no direct update needed
    // This is a no-op in auth mode; score is computed from answers.
  }

  async startSession(category) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const sessionId = Crypto.randomUUID();
      data.sessions.push({
        id: sessionId,
        category,
        startedAt: new Date().toISOString(),
        completedAt: null,
        answers: [],
      });
      await this._writeGuestData(data);
      return sessionId;
    }
    // auth mode
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: this.authState.user.id,
        category,
        score: 0,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async completeSession(sessionId) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const session = data.sessions.find((s) => s.id === sessionId);
      if (session) {
        session.completedAt = new Date().toISOString();
        session.score = session.answers.filter((a) => a.isCorrect).length;
      }
      await this._writeGuestData(data);
      return;
    }
    // auth mode
    const { data: attempts, error: err1 } = await supabase
      .from('question_attempts')
      .select('is_correct')
      .eq('session_id', sessionId);
    if (err1) throw err1;
    const score = attempts.filter((a) => a.is_correct).length;
    const { error } = await supabase
      .from('game_sessions')
      .update({ completed_at: new Date().toISOString(), score })
      .eq('id', sessionId);
    if (error) throw error;
  }

  async saveAnswer(sessionId, category, questionId, selectedAnswer, isCorrect) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      session.answers.push({
        questionId,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date().toISOString(),
      });
      await this._writeGuestData(data);
      return;
    }
    // auth mode
    const { error } = await supabase.from('question_attempts').insert({
      session_id: sessionId,
      user_id: this.authState.user.id,
      category,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });
    if (error) throw error;
  }

  async getAnsweredQuestions(category = null) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const all = data.sessions.flatMap((s) =>
        s.answers.map((a) => ({ ...a, category: s.category }))
      );
      return category ? all.filter((a) => a.category === category) : all;
    }
    // auth mode
    let query = supabase
      .from('question_attempts')
      .select('question_id, selected_answer, is_correct, category, answered_at')
      .eq('user_id', this.authState.user.id);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((row) => ({
      questionId: row.question_id,
      selectedAnswer: row.selected_answer,
      isCorrect: row.is_correct,
      category: row.category,
      answeredAt: row.answered_at,
    }));
  }

  async clearAllData() {
    if (this.authState.mode === 'guest') {
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      return;
    }
    // auth mode: handled by delete-account Edge Function
    throw new Error('clearAllData for authenticated users must use the delete-account Edge Function');
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- __tests__/storage.test.js`
Expected: All 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add services/storage.js
git commit -m "feat: add StorageService with guest mode AsyncStorage support"
```

---

## Task 7: Replace AppContext with GameContext

**Files:**
- Create: `context/GameContext.js`
- Delete: `context/AppContext.js`

- [ ] **Step 1: Create GameContext**

Create `context/GameContext.js`:
```javascript
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { useAuthContext } from './AuthContext';

const GameContext = createContext();

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const auth = useAuthContext();
  const [score, setScore] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const storage = new StorageService(auth);

  const MAX_SCORE = 5;

  // Load score when auth state changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    storage
      .getScore()
      .then((s) => {
        if (!cancelled) {
          setScore(s);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[GameContext] Failed to load score:', err);
        if (!cancelled) {
          setScore(0);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.mode, auth.user?.id]);

  const incrementScore = useCallback(async () => {
    const next = Math.min(score + 1, MAX_SCORE);
    setScore(next);
    try {
      await storage.updateScore(next);
    } catch (err) {
      console.error('[GameContext] Failed to persist score:', err);
    }
  }, [score, storage]);

  const decrementScore = useCallback(async () => {
    const next = Math.max(score - 1, 0);
    setScore(next);
    try {
      await storage.updateScore(next);
    } catch (err) {
      console.error('[GameContext] Failed to persist score:', err);
    }
  }, [score, storage]);

  const resetScore = useCallback(async () => {
    setScore(0);
    try {
      await storage.updateScore(0);
    } catch (err) {
      console.error('[GameContext] Failed to reset score:', err);
    }
  }, [storage]);

  const startSession = useCallback(
    async (category) => {
      try {
        const id = await storage.startSession(category);
        setCurrentSessionId(id);
        return id;
      } catch (err) {
        console.error('[GameContext] Failed to start session:', err);
        return null;
      }
    },
    [storage]
  );

  const saveAnswer = useCallback(
    async (category, questionId, selectedAnswer, isCorrect) => {
      if (!currentSessionId) {
        console.warn('[GameContext] saveAnswer called without active session');
        return;
      }
      try {
        await storage.saveAnswer(currentSessionId, category, questionId, selectedAnswer, isCorrect);
      } catch (err) {
        console.error('[GameContext] Failed to save answer:', err);
      }
    },
    [currentSessionId, storage]
  );

  const completeSession = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      await storage.completeSession(currentSessionId);
    } catch (err) {
      console.error('[GameContext] Failed to complete session:', err);
    }
    setCurrentSessionId(null);
  }, [currentSessionId, storage]);

  const value = {
    score,
    isLoading,
    incrementScore,
    decrementScore,
    resetScore,
    startSession,
    saveAnswer,
    completeSession,
    currentSessionId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Backwards-compatibility alias so existing screens using useAppContext still work during migration
export const useAppContext = useGameContext;
```

- [ ] **Step 2: Delete AppContext.js**

Run:
```bash
git rm context/AppContext.js
```

- [ ] **Step 3: Commit**

```bash
git add context/GameContext.js
git commit -m "feat: replace AppContext with GameContext, integrate StorageService"
```

Note: The app will not build yet because screens still import from `./context/AppContext`. Next task fixes that.

---

## Task 8: Create AuthContext (skeleton — guest mode only for now)

**Files:**
- Create: `context/AuthContext.js`

- [ ] **Step 1: Create AuthContext**

Create `context/AuthContext.js`:
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

const GUEST_MODE_FLAG = '@mytree_guest_mode_active';

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // mode: 'loading' | 'welcome' | 'guest' | 'auth'
  const [mode, setMode] = useState('loading');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing Supabase session on app launch
    let subscription;
    const init = async () => {
      if (isSupabaseConfigured()) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setMode('auth');
        } else {
          // No Supabase session. Check if user previously continued as guest.
          const guestFlag = await AsyncStorage.getItem(GUEST_MODE_FLAG);
          if (guestFlag === 'true') {
            setMode('guest');
          } else {
            setMode('welcome');
          }
        }

        // Listen for auth state changes
        const listener = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            setMode('auth');
          } else {
            setSession(null);
            setUser(null);
            setMode('welcome');
          }
        });
        subscription = listener.data.subscription;
      } else {
        // Supabase not configured — check for guest mode flag, else welcome
        const guestFlag = await AsyncStorage.getItem(GUEST_MODE_FLAG);
        setMode(guestFlag === 'true' ? 'guest' : 'welcome');
      }
    };
    init();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = async () => {
    await AsyncStorage.setItem(GUEST_MODE_FLAG, 'true');
    setMode('guest');
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(GUEST_MODE_FLAG);
    setMode('welcome');
  };

  const value = {
    mode,
    user,
    session,
    continueAsGuest,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

- [ ] **Step 2: Commit**

```bash
git add context/AuthContext.js
git commit -m "feat: add AuthContext skeleton with session persistence"
```

---

## Task 9: Create WelcomeScreen

**Files:**
- Create: `screens/WelcomeScreen.js`

- [ ] **Step 1: Create the screen**

Create `screens/WelcomeScreen.js`:
```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function WelcomeScreen({ navigation }) {
  const { continueAsGuest } = useAuthContext();

  const onAppleSignIn = () => {
    Alert.alert('Coming soon', 'Sign in with Apple will be wired up in Phase 3.');
  };

  const onGoogleSignIn = () => {
    Alert.alert('Coming soon', 'Sign in with Google will be wired up in Phase 3.');
  };

  const onEmailSignIn = () => {
    Alert.alert('Coming soon', 'Magic link email will be wired up in Phase 3.');
  };

  const onGuest = () => {
    continueAsGuest();
  };

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/image/My_Tree_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>My Tree</Text>
        <Text style={styles.tagline}>Grow your tree by learning about climate</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.appleButton} onPress={onAppleSignIn}>
          <Text style={styles.appleButtonText}>Sign in with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={onGoogleSignIn}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emailButton} onPress={onEmailSignIn}>
          <Text style={styles.emailButtonText}>Sign in with Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestButton} onPress={onGuest}>
          <Text style={styles.guestButtonText}>Continue as Guest →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
    fontFamily: fonts.bold,
  },
  tagline: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  buttonContainer: {
    width: '100%',
  },
  appleButton: {
    backgroundColor: colors.black,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
  },
  appleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
  },
  googleButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  emailButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
  },
  emailButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  guestButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestButtonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/WelcomeScreen.js
git commit -m "feat: add WelcomeScreen with auth options and guest entry"
```

---

## Task 10: Create MagicLinkSentScreen (placeholder)

**Files:**
- Create: `screens/MagicLinkSentScreen.js`

- [ ] **Step 1: Create the screen**

Create `screens/MagicLinkSentScreen.js`:
```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function MagicLinkSentScreen({ navigation, route }) {
  const email = route.params?.email || 'your email';

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.description}>
          We sent a sign-in link to {email}. Tap the link in the email to sign in.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.buttonText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: fonts.regular,
  },
  button: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/MagicLinkSentScreen.js
git commit -m "feat: add MagicLinkSentScreen placeholder"
```

---

## Task 11: Create SettingsScreen

**Files:**
- Create: `screens/SettingsScreen.js`

- [ ] **Step 1: Create the screen**

Create `screens/SettingsScreen.js`:
```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { useGameContext } from '../context/GameContext';
import { GUEST_STORAGE_KEY } from '../services/storage';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { mode, user, signOut } = useAuthContext();
  const { resetScore } = useGameContext();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming soon', 'Account deletion will be wired up in Phase 3.');
          },
        },
      ]
    );
  };

  const handleResetGuest = async () => {
    Alert.alert(
      'Reset Progress',
      'This will clear your tree score and question history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
            await resetScore();
            Alert.alert('Reset complete', 'Your progress has been cleared.');
          },
        },
      ]
    );
  };

  const handleSignIn = () => {
    navigation.navigate('Welcome');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {mode === 'auth' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email || 'Unknown'}</Text>
              {user?.user_metadata?.full_name && (
                <>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <Text style={styles.fieldValue}>{user.user_metadata.full_name}</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <Text style={styles.fieldValue}>Playing as Guest</Text>
              <Text style={styles.note}>
                Sign in to save your progress and access it from any device.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
              <Text style={styles.primaryButtonText}>Sign in to save progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleResetGuest}>
              <Text style={styles.dangerButtonText}>Reset Progress</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: colors.lightGreen,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
  },
  placeholder: { width: 40 },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    marginBottom: 12,
    fontFamily: fonts.bold,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 10,
    fontFamily: fonts.regular,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.black,
    fontFamily: fonts.semiBold,
  },
  note: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 10,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  primaryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  dangerButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.errorRed,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  dangerButtonText: {
    color: colors.errorRed,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/SettingsScreen.js
git commit -m "feat: add SettingsScreen for auth and guest users"
```

---

## Task 12: Rewire App.js with Auth provider and new navigation

**Files:**
- Modify: `App.js`

- [ ] **Step 1: Replace App.js with the new structure**

Full replacement of `App.js`:
```javascript
import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import WelcomeScreen from './screens/WelcomeScreen';
import MagicLinkSentScreen from './screens/MagicLinkSentScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import QuestionScreen from './screens/QuestionScreen';
import AnswerScreen from './screens/AnswerScreen';
import TreeAnimationScreen from './screens/TreeAnimationScreen';
import TreeScreen from './screens/TreeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { colors } from './constants/colors';

SplashScreen.preventAutoHideAsync();
const Stack = createStackNavigator();

function AppNavigator() {
  const { mode } = useAuthContext();

  if (mode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  // Both 'welcome' and unauth users land on Welcome as initial route.
  // 'guest' and 'auth' land on Home as initial route.
  const initialRoute = mode === 'welcome' ? 'Welcome' : 'Home';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ cardStyle: { flex: 1 }, headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MagicLinkSent" component={MagicLinkSentScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="TreeAnimation" component={TreeAnimationScreen} />
        <Stack.Screen name="Answer" component={AnswerScreen} />
        <Stack.Screen name="Tree" component={TreeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = isWeb && width > 400;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GameProvider>
          <View style={[styles.appOuter, isWide && styles.appOuterWide]}>
            <View style={[styles.appInner, isWide && styles.appInnerWide]}>
              <AppNavigator />
            </View>
          </View>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appOuter: { flex: 1 },
  appOuterWide: { alignItems: 'center', backgroundColor: '#f5f5f5' },
  appInner: { flex: 1, width: '100%' },
  appInnerWide: { maxWidth: 420 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
```

- [ ] **Step 2: Verify app builds**

Run: `npx expo export --platform web --dev 2>&1 | tail -30`
Expected: Build succeeds. Warnings about unused imports in screens are OK.

- [ ] **Step 3: Commit**

```bash
git add App.js
git commit -m "feat: add AuthProvider and restructure navigation with Welcome/Settings screens"
```

---

## Task 13: Update existing screens to use GameContext

**Files:**
- Modify: `screens/HomeScreen.js`
- Modify: `screens/QuestionScreen.js`
- Modify: `screens/AnswerScreen.js`
- Modify: `screens/TreeScreen.js`
- Modify: `screens/TreeAnimationScreen.js`

- [ ] **Step 1: Update HomeScreen to add Settings gear icon**

In `screens/HomeScreen.js`, find the top of the component return and add a gear icon. Replace the entire `HomeScreen` function's return statement:

Find:
```javascript
    return (
        <LinearGradient
            colors={[colors.lightGreen, colors.white]}
            style={styles.container}
        >
            <StatusBar style="auto" />
```

Replace with:
```javascript
    return (
        <LinearGradient
            colors={[colors.lightGreen, colors.white]}
            style={styles.container}
        >
            <StatusBar style="auto" />
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
            >
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
```

Then add these styles to the styles object in `HomeScreen.js`:
```javascript
    settingsButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
    },
    settingsIcon: {
        fontSize: 24,
    },
```

- [ ] **Step 2: Update QuestionScreen to start a session**

In `screens/QuestionScreen.js`:

Find this line near the top:
```javascript
import { useAppContext } from '../context/AppContext';
```

Replace with:
```javascript
import { useGameContext } from '../context/GameContext';
```

Find:
```javascript
    const { score } = useAppContext();
```

Replace with:
```javascript
    const { score, startSession, currentSessionId } = useGameContext();
```

Find this `useEffect`:
```javascript
    useEffect(() => {
        // Convert display name to data key
        const categoryKey = mapCategoryToKey(category);

        // Get all questions for this category
        const categoryQuestions = getQuestionsByCategory(categoryKey);
        setQuestions(categoryQuestions);

        // Get question index from route params (if navigating from AnswerScreen)
        const indexFromRoute = route.params?.questionIndex ?? 0;
        setQuestionIndex(indexFromRoute);

        // Set the current question based on index
        if (categoryQuestions.length > 0 && indexFromRoute < categoryQuestions.length) {
            setCurrentQuestion(categoryQuestions[indexFromRoute]);
            setSelectedAnswer(null); // Reset selected answer when question changes
        }
    }, [category, route.params?.questionIndex]);
```

Replace with:
```javascript
    useEffect(() => {
        const categoryKey = mapCategoryToKey(category);
        const categoryQuestions = getQuestionsByCategory(categoryKey);
        setQuestions(categoryQuestions);

        const indexFromRoute = route.params?.questionIndex ?? 0;
        setQuestionIndex(indexFromRoute);

        if (categoryQuestions.length > 0 && indexFromRoute < categoryQuestions.length) {
            setCurrentQuestion(categoryQuestions[indexFromRoute]);
            setSelectedAnswer(null);
        }

        // Start a new session when entering the first question (index 0)
        if (indexFromRoute === 0 && !currentSessionId) {
            startSession(categoryKey);
        }
    }, [category, route.params?.questionIndex]);
```

- [ ] **Step 3: Update AnswerScreen**

In `screens/AnswerScreen.js`:

Find:
```javascript
import { useAppContext } from '../context/AppContext';
```

Replace with:
```javascript
import { useGameContext } from '../context/GameContext';
```

Find:
```javascript
    const { score, incrementScore, decrementScore } = useAppContext();
```

Replace with:
```javascript
    const { score, incrementScore, decrementScore, saveAnswer, completeSession } = useGameContext();
```

Find this `useEffect`:
```javascript
    useEffect(() => {
        if (scoreAlreadyUpdated) return;
        // Create a unique key for this question (category + question id)
        const questionKey = question ? `${category}-${question.id}-${questionIndex}` : null;

        if (question && selectedAnswer !== null && questionKey && !scoredQuestionsRef.current.has(questionKey)) {
            // Mark this question as scored
            scoredQuestionsRef.current.add(questionKey);

            // Update the score
            if (isCorrect) {
                incrementScore();
            } else {
                decrementScore();
            }
        }
    }, [question?.id, questionIndex, category, selectedAnswer, isCorrect, incrementScore, decrementScore, scoreAlreadyUpdated]);
```

Replace with:
```javascript
    useEffect(() => {
        if (scoreAlreadyUpdated) return;
        const questionKey = question ? `${category}-${question.id}-${questionIndex}` : null;

        if (question && selectedAnswer !== null && questionKey && !scoredQuestionsRef.current.has(questionKey)) {
            scoredQuestionsRef.current.add(questionKey);

            // Persist the answer
            const categoryKey = category === 'Energy' ? 'energy'
                : category === 'Transportation' ? 'transportation'
                : category === 'Food & Agriculture' ? 'foodAgriculture'
                : category === 'Carbon Removal' ? 'carbonRemoval'
                : category;
            saveAnswer(categoryKey, question.id, selectedAnswer, isCorrect);

            if (isCorrect) {
                incrementScore();
            } else {
                decrementScore();
            }

            // If this was the last question, complete the session
            if (!hasNextQuestion) {
                completeSession();
            }
        }
    }, [question?.id, questionIndex, category, selectedAnswer, isCorrect, incrementScore, decrementScore, scoreAlreadyUpdated, saveAnswer, completeSession, hasNextQuestion]);
```

- [ ] **Step 4: Update TreeScreen**

In `screens/TreeScreen.js`:

Find:
```javascript
import { useAppContext } from '../context/AppContext';
```

Replace with:
```javascript
import { useGameContext } from '../context/GameContext';
```

Find:
```javascript
    const { score } = useAppContext();
```

Replace with:
```javascript
    const { score } = useGameContext();
```

- [ ] **Step 5: Update TreeAnimationScreen**

In `screens/TreeAnimationScreen.js`:

Find:
```javascript
import { useAppContext } from '../context/AppContext';
```

Replace with:
```javascript
import { useGameContext } from '../context/GameContext';
```

Find:
```javascript
    const { incrementScore, decrementScore } = useAppContext();
```

Replace with:
```javascript
    const { incrementScore, decrementScore } = useGameContext();
```

- [ ] **Step 6: Verify app builds**

Run: `npx expo export --platform web --dev 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add screens/HomeScreen.js screens/QuestionScreen.js screens/AnswerScreen.js screens/TreeScreen.js screens/TreeAnimationScreen.js
git commit -m "feat: migrate screens from AppContext to GameContext with session tracking"
```

---

## Task 14: Test Phase 1 end-to-end manually

**Files:** None (manual verification)

- [ ] **Step 1: Start the app in dev mode**

Run: `npm start`
Open on iOS simulator or web.

- [ ] **Step 2: Verify Welcome screen appears**

Expected:
- App launches to Welcome screen (not directly to Home)
- Four buttons visible: Apple, Google, Email, Continue as Guest

- [ ] **Step 3: Tap "Continue as Guest"**

Expected:
- Navigates to Home screen
- Gear icon visible in top right

- [ ] **Step 4: Play through a full category**

Expected:
- Answer 5 questions
- Score updates correctly after each question
- Tree grows/shrinks appropriately

- [ ] **Step 5: Close and reopen the app**

Expected:
- App launches directly to Home screen (guest mode flag is persisted in AsyncStorage)
- Score matches what it was before closing

- [ ] **Step 6: Visit Settings**

Expected:
- Tap gear icon from Home
- See "Playing as Guest" message
- "Sign in to save progress" and "Reset Progress" buttons visible

- [ ] **Step 7: Tap "Reset Progress"**

Expected:
- Confirmation dialog appears
- After confirming, score is 0, AsyncStorage is cleared

- [ ] **Step 8: If all above works, mark Phase 1 complete**

```bash
git tag phase-1-complete
```

---

# Phase 2: Supabase Project Setup

**These tasks must be performed by the user in web dashboards. The agent cannot do these. The agent can generate files to assist.**

---

## Task 15: Generate schema SQL file

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create the SQL file**

Create `supabase/schema.sql`:
```sql
-- MyTree Supabase schema
-- Run this in the Supabase SQL Editor after creating your project.

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_game_sessions_user ON public.game_sessions(user_id);

CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX idx_question_attempts_session ON public.question_attempts(session_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can CRUD their own row
CREATE POLICY "Users select own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Game sessions
CREATE POLICY "Users select own sessions" ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.game_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Question attempts
CREATE POLICY "Users select own attempts" ON public.question_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.question_attempts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own attempts" ON public.question_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "chore: add supabase schema SQL for user to apply"
```

---

## Task 16: User runs Supabase setup (manual)

**This task is performed by the user. The agent should pause here and prompt the user when reached.**

- [ ] **Step 1: Create Supabase project**

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for provisioning (~2 min)

- [ ] **Step 2: Run the schema SQL**

1. In Supabase dashboard: SQL Editor → New query
2. Paste contents of `supabase/schema.sql`
3. Run. Verify no errors.

- [ ] **Step 3: Enable Email auth (magic link)**

1. Dashboard → Authentication → Providers
2. Ensure Email is enabled
3. Enable "Confirm email" = ON
4. Under "Email templates", confirm default magic link template is fine

- [ ] **Step 4: Enable Apple auth**

Requires an Apple Developer account ($99/year).

1. In Apple Developer → Certificates, Identifiers & Profiles:
   - Create a Services ID (e.g., `com.mytree.auth`)
   - Enable Sign In with Apple
   - Configure return URL: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Create a Sign in with Apple key, download `.p8` file
3. In Supabase dashboard → Authentication → Providers → Apple:
   - Services ID: the one you created
   - Team ID: from Apple Developer
   - Key ID: from the .p8 file name
   - Private Key: paste contents of the .p8 file

- [ ] **Step 5: Enable Google auth**

1. In Google Cloud Console:
   - Create OAuth 2.0 Client ID (type: iOS, Web, and Android as needed)
   - For web redirect: `https://<project-ref>.supabase.co/auth/v1/callback`
2. In Supabase dashboard → Authentication → Providers → Google:
   - Client ID from Google Cloud
   - Client Secret from Google Cloud

- [ ] **Step 6: Copy API credentials**

1. Dashboard → Settings → API
2. Copy "Project URL" → paste into `.env` as `EXPO_PUBLIC_SUPABASE_URL=...`
3. Copy "anon public" key → paste into `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`

- [ ] **Step 7: Configure redirect URLs for the app**

1. Dashboard → Authentication → URL Configuration
2. Add Redirect URLs:
   - `mytree://auth-callback` (for native)
   - `http://localhost:8081/*` (for web dev)
   - Your production web URL (e.g., `https://boffdub.github.io/mytree/*`)

- [ ] **Step 8: Verify setup**

Run the app:
```bash
npm start
```

Check console — no more "Missing EXPO_PUBLIC_SUPABASE_URL" warning.

---

## Task 17: Update app.json with deep link scheme

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Add scheme to app.json**

In `app.json`, under the `expo` key, add:
```json
"scheme": "mytree"
```

If `scheme` already exists, leave it. Place it near `"name"` and `"slug"`.

- [ ] **Step 2: Verify**

Run: `npx expo export --platform web 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "chore: add mytree:// deep link scheme for auth callbacks"
```

---

# Phase 3: Wire up Supabase auth, migration, and deletion

## Task 18: Create auth helper methods

**Files:**
- Create: `services/auth.js`

- [ ] **Step 1: Create the auth helpers**

Create `services/auth.js`:
```javascript
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: 'mytree',
  path: 'auth-callback',
});

export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Apple sign-in cancelled');
  }

  // Parse tokens from the callback URL
  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('No tokens returned from Apple sign-in');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Google sign-in cancelled');
  }

  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('No tokens returned from Google sign-in');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add services/auth.js
git commit -m "feat: add auth helper methods for apple, google, and magic link"
```

---

## Task 19: Write migration tests (TDD)

**Files:**
- Create: `__tests__/migration.test.js`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/migration.test.js`:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateGuestToAuth, GUEST_STORAGE_KEY } from '../services/migration';

// Mock the supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../services/supabase';

describe('migrateGuestToAuth', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    supabase.from.mockReset();
  });

  test('inserts session rows and answer rows, then clears guest data', async () => {
    // Seed guest data
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        guestId: 'guest-123',
        score: 3,
        sessions: [
          {
            id: 'local-session-1',
            category: 'energy',
            startedAt: '2026-04-15T10:00:00Z',
            completedAt: '2026-04-15T10:05:00Z',
            answers: [
              { questionId: 1, selectedAnswer: 0, isCorrect: true, answeredAt: '2026-04-15T10:01:00Z' },
              { questionId: 2, selectedAnswer: 2, isCorrect: false, answeredAt: '2026-04-15T10:02:00Z' },
            ],
          },
        ],
      })
    );

    // Mock Supabase chain
    const sessionInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'remote-session-1' }, error: null }),
      }),
    });
    const attemptInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockImplementation((table) => {
      if (table === 'game_sessions') return { insert: sessionInsert };
      if (table === 'question_attempts') return { insert: attemptInsert };
      throw new Error(`Unexpected table: ${table}`);
    });

    await migrateGuestToAuth('user-abc');

    expect(sessionInsert).toHaveBeenCalledWith({
      user_id: 'user-abc',
      category: 'energy',
      score: 1,
      started_at: '2026-04-15T10:00:00Z',
      completed_at: '2026-04-15T10:05:00Z',
    });
    expect(attemptInsert).toHaveBeenCalledWith([
      {
        session_id: 'remote-session-1',
        user_id: 'user-abc',
        category: 'energy',
        question_id: 1,
        selected_answer: 0,
        is_correct: true,
        answered_at: '2026-04-15T10:01:00Z',
      },
      {
        session_id: 'remote-session-1',
        user_id: 'user-abc',
        category: 'energy',
        question_id: 2,
        selected_answer: 2,
        is_correct: false,
        answered_at: '2026-04-15T10:02:00Z',
      },
    ]);

    // Guest data cleared
    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    expect(raw).toBeNull();
  });

  test('is a no-op when no guest data exists', async () => {
    supabase.from.mockImplementation(() => {
      throw new Error('Should not call Supabase when no guest data');
    });
    await expect(migrateGuestToAuth('user-abc')).resolves.not.toThrow();
  });

  test('does not clear guest data if session insert fails', async () => {
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        guestId: 'guest-123',
        score: 1,
        sessions: [
          {
            id: 'local-1',
            category: 'energy',
            startedAt: '2026-04-15T10:00:00Z',
            completedAt: null,
            answers: [],
          },
        ],
      })
    );

    const sessionInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      }),
    });
    supabase.from.mockImplementation(() => ({ insert: sessionInsert }));

    await expect(migrateGuestToAuth('user-abc')).rejects.toThrow();

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    expect(raw).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- __tests__/migration.test.js`
Expected: Tests fail with "Cannot find module '../services/migration'".

- [ ] **Step 3: Commit tests**

```bash
git add __tests__/migration.test.js
git commit -m "test: add guest-to-auth migration tests"
```

---

## Task 20: Implement migration

**Files:**
- Create: `services/migration.js`

- [ ] **Step 1: Implement the migration module**

Create `services/migration.js`:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { GUEST_STORAGE_KEY } from './storage';

export { GUEST_STORAGE_KEY };

export async function migrateGuestToAuth(userId) {
  const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return; // nothing to migrate

  const data = JSON.parse(raw);
  if (!data.sessions || data.sessions.length === 0) {
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    return;
  }

  // Migrate each session serially to keep error handling simple
  for (const session of data.sessions) {
    const score = session.answers.filter((a) => a.isCorrect).length;
    const { data: inserted, error: insertError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        category: session.category,
        score,
        started_at: session.startedAt,
        completed_at: session.completedAt,
      })
      .select('id')
      .single();
    if (insertError) {
      throw new Error(`Failed to migrate session: ${insertError.message}`);
    }

    if (session.answers.length > 0) {
      const attemptRows = session.answers.map((a) => ({
        session_id: inserted.id,
        user_id: userId,
        category: session.category,
        question_id: a.questionId,
        selected_answer: a.selectedAnswer,
        is_correct: a.isCorrect,
        answered_at: a.answeredAt,
      }));
      const { error: attemptError } = await supabase
        .from('question_attempts')
        .insert(attemptRows);
      if (attemptError) {
        throw new Error(`Failed to migrate answers: ${attemptError.message}`);
      }
    }
  }

  // All successful — clear local guest data
  await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
}
```

- [ ] **Step 2: Run tests**

Run: `npm test -- __tests__/migration.test.js`
Expected: All 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add services/migration.js
git commit -m "feat: add guest-to-auth migration logic"
```

---

## Task 21: Wire migration into AuthContext

**Files:**
- Modify: `context/AuthContext.js`

- [ ] **Step 1: Add migration call on sign-in**

Edit `context/AuthContext.js`. Find this block:
```javascript
        // Listen for auth state changes
        const listener = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            setMode('auth');
          } else {
            setSession(null);
            setUser(null);
            setMode('welcome');
          }
        });
```

Replace with:
```javascript
        // Listen for auth state changes
        const listener = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (newSession) {
            // On initial sign-in (not just token refresh), migrate any guest data
            if (event === 'SIGNED_IN') {
              try {
                await migrateGuestToAuth(newSession.user.id);
              } catch (err) {
                console.error('[Auth] Migration failed:', err);
                // Continue anyway — user is signed in, migration can be retried later
              }
              // Clear guest mode flag now that user has signed in
              await AsyncStorage.removeItem(GUEST_MODE_FLAG);
            }
            setSession(newSession);
            setUser(newSession.user);
            setMode('auth');
          } else {
            setSession(null);
            setUser(null);
            setMode('welcome');
          }
        });
```

Also add this import at the top of `context/AuthContext.js` (merge with existing imports):
```javascript
import { migrateGuestToAuth } from '../services/migration';
```

- [ ] **Step 2: Commit**

```bash
git add context/AuthContext.js
git commit -m "feat: trigger guest-to-auth migration on sign in"
```

---

## Task 22: Wire up email sign-in in WelcomeScreen

**Files:**
- Modify: `screens/WelcomeScreen.js`
- Create: `screens/EmailInputScreen.js`
- Modify: `App.js`

- [ ] **Step 1: Create EmailInputScreen**

Create `screens/EmailInputScreen.js`:
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmail } from '../services/auth';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function EmailInputScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email);
      navigation.navigate('MagicLinkSent', { email });
    } catch (err) {
      Alert.alert('Sign-in error', err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign in with Email</Text>
        <Text style={styles.description}>
          We'll send you a magic link. No password required.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Send Magic Link</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancel}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  content: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: fonts.regular,
  },
  input: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: fonts.regular,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  cancel: { paddingVertical: 10 },
  cancelText: {
    color: colors.gray,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
});
```

- [ ] **Step 2: Register EmailInputScreen in App.js**

In `App.js`, find:
```javascript
import MagicLinkSentScreen from './screens/MagicLinkSentScreen';
```

Add below it:
```javascript
import EmailInputScreen from './screens/EmailInputScreen';
```

Then find:
```javascript
        <Stack.Screen name="MagicLinkSent" component={MagicLinkSentScreen} />
```

Add below it:
```javascript
        <Stack.Screen name="EmailInput" component={EmailInputScreen} />
```

- [ ] **Step 3: Update WelcomeScreen to use real auth methods**

In `screens/WelcomeScreen.js`:

Find:
```javascript
import { useAuthContext } from '../context/AuthContext';
```

Add below it:
```javascript
import { signInWithApple, signInWithGoogle } from '../services/auth';
```

Find:
```javascript
  const onAppleSignIn = () => {
    Alert.alert('Coming soon', 'Sign in with Apple will be wired up in Phase 3.');
  };

  const onGoogleSignIn = () => {
    Alert.alert('Coming soon', 'Sign in with Google will be wired up in Phase 3.');
  };

  const onEmailSignIn = () => {
    Alert.alert('Coming soon', 'Magic link email will be wired up in Phase 3.');
  };
```

Replace with:
```javascript
  const onAppleSignIn = async () => {
    try {
      await signInWithApple();
      // AuthContext listener will handle navigation on success
    } catch (err) {
      Alert.alert('Sign-in error', err.message || 'Failed to sign in with Apple');
    }
  };

  const onGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Sign-in error', err.message || 'Failed to sign in with Google');
    }
  };

  const onEmailSignIn = () => {
    navigation.navigate('EmailInput');
  };
```

- [ ] **Step 4: Commit**

```bash
git add screens/EmailInputScreen.js screens/WelcomeScreen.js App.js
git commit -m "feat: wire up real auth flows in welcome screen"
```

---

## Task 23: Create and deploy the delete-account Edge Function

**Files:**
- Create: `supabase/functions/delete-account/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/delete-account/index.ts`:
```typescript
// Supabase Edge Function: delete-account
// Deletes the authenticated user's data and auth record.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the user's JWT from the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client to verify the user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // Admin client (service role) for deletion
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Cascade deletion is handled by ON DELETE CASCADE in the schema,
    // but we delete the auth.users row which cascades to profiles -> game_sessions -> question_attempts.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function (user action)**

User must install Supabase CLI and deploy:
```bash
# One-time CLI install
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy delete-account
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/delete-account/index.ts
git commit -m "feat: add delete-account edge function for account deletion"
```

---

## Task 24: Wire up account deletion in SettingsScreen

**Files:**
- Modify: `screens/SettingsScreen.js`

- [ ] **Step 1: Replace the deletion stub**

In `screens/SettingsScreen.js`:

Find:
```javascript
import { useAuthContext } from '../context/AuthContext';
```

Add below it:
```javascript
import { supabase } from '../services/supabase';
```

Find:
```javascript
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming soon', 'Account deletion will be wired up in Phase 3.');
          },
        },
      ]
    );
  };
```

Replace with:
```javascript
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              // signOut clears local session; AuthContext listener sends user to Welcome
              await signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            } catch (err) {
              Alert.alert('Deletion failed', err.message || 'Could not delete account');
            }
          },
        },
      ]
    );
  };
```

- [ ] **Step 2: Commit**

```bash
git add screens/SettingsScreen.js
git commit -m "feat: wire up account deletion via edge function"
```

---

## Task 25: Add sign-in prompts for guests

**Files:**
- Modify: `screens/TreeScreen.js`
- Modify: `screens/AnswerScreen.js`

- [ ] **Step 1: Add banner to TreeScreen**

In `screens/TreeScreen.js`:

Find the existing import line for `react-native` (something like `import { View, StyleSheet, ... } from 'react-native';`). Ensure `TouchableOpacity` and `Text` are included in that import (they likely already are — if so, leave it alone).

Find:
```javascript
import { useGameContext } from '../context/GameContext';
```

Add below it:
```javascript
import { useAuthContext } from '../context/AuthContext';
```

Find the hook call:
```javascript
    const { score } = useGameContext();
```

Add below it:
```javascript
    const { mode } = useAuthContext();
```

Find the screen's return and locate where the main content is rendered. At the top of the main view, add:
```javascript
{mode === 'guest' && (
  <TouchableOpacity
    style={localPromptStyles.banner}
    onPress={() => navigation.navigate('Welcome')}
  >
    <Text style={localPromptStyles.bannerText}>
      🌱 Sign in to save your tree across devices
    </Text>
  </TouchableOpacity>
)}
```

At the bottom of the file (before the `export default`), add the local styles:
```javascript
const localPromptStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF4D6',
    borderWidth: 1,
    borderColor: '#E0C97F',
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bannerText: {
    color: '#8A6D1F',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Add prompt modal to AnswerScreen (end of category)**

In `screens/AnswerScreen.js`:

Merge these into the existing imports at the top of the file:
- Ensure `Modal` is included in the `from 'react-native'` import line (add it if missing).
- Ensure `useState` and `useEffect` are included in the `from 'react'` import line (add them if missing — `useEffect` is likely already imported).

Find:
```javascript
import { useGameContext } from '../context/GameContext';
```

Add below it:
```javascript
import { useAuthContext } from '../context/AuthContext';
```

Find:
```javascript
    const { score, incrementScore, decrementScore, saveAnswer, completeSession } = useGameContext();
```

Add below it:
```javascript
    const { mode } = useAuthContext();
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
```

Add a new `useEffect` just after the existing scoring `useEffect` (find the closing `}, [question?.id, ..., completeSession, hasNextQuestion]);` — add this new effect below it):
```javascript
    // Show sign-in prompt to guests after completing the final question
    useEffect(() => {
        if (mode === 'guest' && !hasNextQuestion && question && selectedAnswer !== null) {
            const t = setTimeout(() => setShowSignInPrompt(true), 800);
            return () => clearTimeout(t);
        }
    }, [mode, hasNextQuestion, question?.id, selectedAnswer]);
```

Then at the end of the main view (right before the closing `</View>` of the screen), add:
```javascript
<Modal
  visible={showSignInPrompt}
  transparent
  animationType="fade"
  onRequestClose={() => setShowSignInPrompt(false)}
>
  <View style={promptStyles.overlay}>
    <View style={promptStyles.card}>
      <Text style={promptStyles.title}>Nice work!</Text>
      <Text style={promptStyles.description}>
        Sign in to save your progress and sync across devices.
      </Text>
      <TouchableOpacity
        style={promptStyles.primary}
        onPress={() => {
          setShowSignInPrompt(false);
          navigation.navigate('Welcome');
        }}
      >
        <Text style={promptStyles.primaryText}>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={promptStyles.secondary}
        onPress={() => setShowSignInPrompt(false)}
      >
        <Text style={promptStyles.secondaryText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

At the bottom of the file, add the prompt styles:
```javascript
const promptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    marginBottom: 10,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: 15,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fonts.regular,
  },
  primary: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  secondary: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.gray,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add screens/TreeScreen.js screens/AnswerScreen.js
git commit -m "feat: add sign-in prompts for guest users"
```

---

# Phase 4: Testing and Polish

## Task 26: Manual end-to-end test — authenticated flow

**Files:** None (manual verification)

**Prerequisite:** Phase 2 is complete, `.env` is populated, and the `delete-account` Edge Function is deployed.

- [ ] **Step 1: Start the app on a real iOS device (OAuth doesn't work reliably in simulator)**

Run: `npm start`, then scan QR code with Expo Go or open the dev build.

- [ ] **Step 2: Test magic link email sign-in**

Expected:
- Tap "Sign in with Email"
- Enter your email
- Check inbox for magic link
- Tap link — app opens, lands on Home screen
- No errors in console

- [ ] **Step 3: Verify user row in Supabase**

In Supabase dashboard → Authentication → Users: new user appears.
In SQL editor: `SELECT * FROM profiles;` — profile row auto-created.

- [ ] **Step 4: Play a category, verify data in Supabase**

- Answer all 5 questions in a category
- In Supabase SQL editor:
  - `SELECT * FROM game_sessions WHERE user_id = '<your-user-id>';` — one row, score = correct count
  - `SELECT * FROM question_attempts WHERE user_id = '<your-user-id>';` — five rows

- [ ] **Step 5: Test Apple Sign In**

- Sign out from Settings
- Land on Welcome
- Tap "Sign in with Apple"
- Complete native Apple flow
- Land on Home

- [ ] **Step 6: Test Google Sign In**

Same as Apple.

- [ ] **Step 7: Test guest-to-auth migration**

- Sign out
- Continue as Guest
- Play 2-3 questions in Energy
- From Settings, tap "Sign in to save progress"
- Sign in with email/Apple/Google
- Verify in Supabase: the 2-3 answers from guest mode appear in `question_attempts`

- [ ] **Step 8: Test account deletion**

- From Settings, tap "Delete Account" → confirm
- In Supabase dashboard: user no longer in Authentication → Users
- Attempting to sign in with same email creates a new account (clean state)

- [ ] **Step 9: Test offline behavior**

- Sign in
- Enable airplane mode
- Try to answer a question
- Expected: Error logged to console, score may not update. App does not crash.
- Disable airplane mode, expected normal behavior resumes.

---

## Task 27: Update .gitignore for supabase

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add supabase local files to gitignore**

Add to the end of `.gitignore`:
```
# Supabase
supabase/.branches
supabase/.temp
supabase/.env
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore supabase local files"
```

---

## Task 28: Final acceptance check

- [ ] **Step 1: All tests pass**

Run: `npm test`
Expected: All StorageService and migration tests pass.

- [ ] **Step 2: Web build succeeds**

Run: `npx expo export --platform web`
Expected: Build completes without errors.

- [ ] **Step 3: iOS build succeeds (requires Mac + Xcode)**

Run: `npm run ios`
Expected: App builds and launches on simulator.

- [ ] **Step 4: All acceptance criteria from the spec are met**

Walk through [design spec](../specs/2026-04-15-auth-persistence-design.md) and verify each section is implemented:
- Section 3: Schema tables exist with RLS policies
- Section 4: All four auth methods work (Apple, Google, Email, Guest)
- Section 5: Guest data shape matches spec
- Section 6: Migration preserves all sessions and answers
- Section 7: StorageService routes correctly
- Section 8: Offline behavior matches spec (guests offline-ok, auth users show errors)
- Section 9: Account deletion works via Edge Function

- [ ] **Step 5: Tag the release**

```bash
git tag auth-persistence-complete
```

---

# Notes on Testing Strategy

**Why only some tests are included:** The current project has no test infrastructure. Adding full React Native component test coverage for 9 screens is out of scope. This plan tests the pure-logic pieces (StorageService, migration) where bugs would cause data loss. UI screens are verified through manual E2E testing in Phase 4.

**Future work (not in this plan):**
- Add `@testing-library/react-native` and write component tests for Welcome/Settings/EmailInput
- Add a smoke test for the Edge Function (deployed locally via `supabase functions serve`)
- Add retry/offline queue based on beta feedback
