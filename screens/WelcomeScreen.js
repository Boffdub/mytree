import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function WelcomeScreen({ navigation }) {
  const { continueAsGuest, signInWithGoogle, mode } = useAuthContext();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Navigate to Home once auth succeeds (e.g. after Google OAuth or magic link)
  useEffect(() => {
    if (mode === 'auth' || mode === 'guest') {
      navigation.replace('Home');
    }
  }, [mode]);

  const onAppleSignIn = () => {
    Alert.alert('Coming soon', 'Sign in with Apple is not yet available.');
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // navigation handled by mode useEffect above
    } catch (err) {
      Alert.alert('Error', err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onEmailSignIn = () => {
    navigation.navigate('EmailSignIn');
  };

  const onGuest = async () => {
    await continueAsGuest();
    navigation.replace('Home');
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

        <TouchableOpacity style={styles.googleButton} onPress={onGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? (
            <ActivityIndicator color={colors.black} />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
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
