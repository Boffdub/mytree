import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function MagicLinkSentScreen({ navigation, route }) {
  const email = route.params?.email || 'your email';
  const { mode } = useAuthContext();

  // Navigate to Home when magic link is tapped and auth succeeds
  useEffect(() => {
    if (mode === 'auth') {
      navigation.replace('Home');
    }
  }, [mode]);

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
