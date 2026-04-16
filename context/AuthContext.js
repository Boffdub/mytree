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
    let subscription;
    const init = async () => {
      if (isSupabaseConfigured()) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setMode('auth');
        } else {
          const guestFlag = await AsyncStorage.getItem(GUEST_MODE_FLAG);
          if (guestFlag === 'true') {
            setMode('guest');
          } else {
            setMode('welcome');
          }
        }

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
