import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';
import ScreenHeader from '../components/ScreenHeader';
import { CurrentRenderContext } from '@react-navigation/native';

const PRIVACY_POLICY_URL = 'https://boffdub.github.io/mytree/privacy.html';
const TERMS_OF_SERVICE_URL = 'https://boffdub.github.io/mytree/terms.html';

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    const doSignOut = async () => {
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
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
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([`${user.id}/avatar.jpg`]);
        if (storageError) {
          console.warn('[Settings] Failed to delete avatar file:', storageError.message);
        }

        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        if (error) throw error;
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
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

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('About')}>
          <Text style={styles.buttonText}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('How To Play')}>
          <Text style={styles.buttonText}>How To Play</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.buttonText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('WebView', { url: PRIVACY_POLICY_URL, title: 'Privacy Policy' })}>
         <Text style={styles.buttonText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('WebView', { url: TERMS_OF_SERVICE_URL, title: 'Terms of Service' })}>
          <Text style={styles.buttonText}>Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Contact Us')}>
          <Text style={styles.buttonText}>Contact Us / Report a Bug</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, },
  bodyContent: { padding: 20, },
  button: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  
  buttonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  dangerButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryRed,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  dangerButtonText: {
    color: colors.primaryRed,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
});
