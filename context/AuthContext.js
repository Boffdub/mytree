import React, { createContext, useState, useContext, useEffect } from "react";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const AuthContext = createContext();

const _webBase =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin + (process.env.EXPO_PUBLIC_WEB_BASE_PATH || "")
    : "http://localhost:8081";
export const REDIRECT_URI =
  Platform.OS === "web" ? _webBase : "mytree://auth-callback";

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`[Auth] ${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);

const parseSessionFromUrl = async (url) => {
  if (!url) return;
  const fragment = url.split("#")[1];
  if (!fragment) return;
  const params = {};
  fragment.split("&").forEach((part) => {
    const [key, val] = part.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || "");
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
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // mode: 'loading' | 'welcome' | 'auth'
  const [mode, setMode] = useState("loading");
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let authSubscription;
    let linkingSubscription;

    const init = async () => {
      if (!isSupabaseConfigured()) {
        setMode("welcome");
        return;
      }

      try {
        // Handle app opened from a cold start via deep link (magic link in email)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await parseSessionFromUrl(initialUrl);
        }

        // Supabase may be unreachable (paused/misconfigured project) - never let this hang forever.
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          "getSession",
        );
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setMode("auth");
        } else {
          setMode("welcome");
        }

        const listener = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              setMode("auth");
            } else {
              setSession(null);
              setUser(null);
              setMode("welcome");
            }
          },
        );
        authSubscription = listener.data.subscription;

        // Handle deep link when app is already running (magic link tapped while app open)
        linkingSubscription = Linking.addEventListener("url", ({ url }) => {
          parseSessionFromUrl(url);
        });
      } catch (err) {
        console.error("[Auth] Init failed, falling back to welcome:", err);
        setMode("welcome");
      }
    };

    init();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      if (linkingSubscription) linkingSubscription.remove();
    };
  }, []);

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URI },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      REDIRECT_URI,
    );
    if (result.type === "success") {
      await parseSessionFromUrl(result.url);
    }
  };

  const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      REDIRECT_URI,
    );
    if (result.type === "success") {
      await parseSessionFromUrl(result.url);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setMode("welcome");
  };

  // Dev-only shortcut so local testing doesn't require clicking a magic link or
  // completing OAuth every time. Requires a real Supabase user + EXPO_PUBLIC_DEV_EMAIL/
  // EXPO_PUBLIC_DEV_PASSWORD in .env; never reachable in a production build (__DEV__ is
  // false there, and WelcomeScreen only renders the button when __DEV__ is true too).
  const signInWithDevAccount = async () => {
    if (!__DEV__)
      throw new Error("Dev sign-in is only available in development builds");
    const email = process.env.EXPO_PUBLIC_DEV_EMAIL;
    const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Set EXPO_PUBLIC_DEV_EMAIL and EXPO_PUBLIC_DEV_PASSWORD in .env to use dev sign-in",
      );
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const value = {
    mode,
    user,
    session,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signInWithDevAccount,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
