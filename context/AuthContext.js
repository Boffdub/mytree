import React, { createContext, useState, useContext, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { migrateGuestToAuth } from '../services/migration';

const AuthContext = createContext();

const GUEST_MODE_FLAG = '@mytree_guest_mode_active';
export const REDIRECT_URI = Platform.OS === 'web'
  ? 'http://localhost:8081'
  : 'mytree://auth-callback';

const parseSessionFromUrl = async (url) => {
  if (!url) return;
  const fragment = url.split('#')[1];
  if (!fragment) return;
  const params = {};
  fragment.split('&').forEach((part) => {
    const [key, val] = part.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
  });
  if (params.access_token && params.refresh_token) {
    await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
  }
};

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
    let authSubscription;
    let linkingSubscription;

    const init = async () => {
      if (isSupabaseConfigured()) {
        // Handle app opened from a cold start via deep link (magic link in email)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await parseSessionFromUrl(initialUrl);
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setMode('auth');
        } else {
          const guestFlag = await AsyncStorage.getItem(GUEST_MODE_FLAG);
          setMode(guestFlag === 'true' ? 'guest' : 'welcome');
        }

        const listener = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (newSession) {
            if (event === 'SIGNED_IN') {
              try {
                await migrateGuestToAuth(newSession.user.id);
              } catch (err) {
                console.error('[Auth] Migration failed:', err);
              }
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
        authSubscription = listener.data.subscription;

        // Handle deep link when app is already running (magic link tapped while app open)
        linkingSubscription = Linking.addEventListener('url', ({ url }) => {
          parseSessionFromUrl(url);
        });
      } else {
        const guestFlag = await AsyncStorage.getItem(GUEST_MODE_FLAG);
        setMode(guestFlag === 'true' ? 'guest' : 'welcome');
      }
    };

    init();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      if (linkingSubscription) linkingSubscription.remove();
    };
  }, []);

  const continueAsGuest = async () => {
    await AsyncStorage.setItem(GUEST_MODE_FLAG, 'true');
    setMode('guest');
  };

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URI },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
    if (result.type === 'success') {
      await parseSessionFromUrl(result.url);
    }
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
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
