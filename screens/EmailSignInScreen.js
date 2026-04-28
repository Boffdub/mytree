import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function EmailSignInScreen({ navigation }) {
  const { signInWithEmail } = useAuthContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(trimmed);
      navigation.navigate('MagicLinkSent', { email: trimmed });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Sign in with Email</Text>
        <Text style={styles.description}>
          Enter your email and we'll send you a magic link to sign in — no password needed.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.gray}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSend}
          returnKeyType="send"
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
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  backButton: { marginBottom: 30 },
  backText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 12,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: 16,
    color: colors.gray,
    lineHeight: 22,
    marginBottom: 30,
    fontFamily: fonts.regular,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: fonts.regular,
    marginBottom: 20,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
});
