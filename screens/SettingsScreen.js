import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useGameContext } from '../context/GameContext';
import { GUEST_STORAGE_KEY } from '../services/storage';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { mode, user, signOut } = useAuthContext();
  const { resetScore } = useGameContext();

  const handleSignOut = async () => {
    const doSignOut = async () => {
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) await doSignOut();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  const handleDeleteAccount = async () => {
    const doDelete = async () => {
      try {
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) throw error;
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } catch (err) {
        if (Platform.OS === 'web') {
          window.alert('Deletion failed: ' + (err.message || 'Could not delete account'));
        } else {
          Alert.alert('Deletion failed', err.message || 'Could not delete account');
        }
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('This will permanently delete your account and all your progress. This cannot be undone.')) {
        await doDelete();
      }
      return;
    }
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  const handleResetGuest = async () => {
    const doReset = async () => {
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      await resetScore();
      if (Platform.OS === 'web') {
        window.alert('Your progress has been cleared.');
      } else {
        Alert.alert('Reset complete', 'Your progress has been cleared.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('This will clear your tree score and question history. Continue?')) await doReset();
      return;
    }
    Alert.alert(
      'Reset Progress',
      'This will clear your tree score and question history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doReset },
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
