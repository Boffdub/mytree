import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';
import { getProfile } from '../services/profile';
import { useFocusEffect } from '@react-navigation/native';
import { calculateStreak } from '../utils/streak';


export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const auth = useAuthContext();
  const [stats, setStats] = useState({ answered: 0, correct: 0, streak: 0 });
  const [profile, setProfile] = useState({ firstName: null, lastName: null, avatarUrl: null });

  useEffect(() => {
    const storage = new StorageService(auth);
    storage.getAnsweredQuestions().then((attempts) => {
      setStats({
        answered: attempts.length,
        correct: attempts.filter((a) => a.isCorrect).length,
        streak: calculateStreak(attempts.map((a) => a.answeredAt)),
      });
    });
  }, [auth.user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (!auth.user?.id) return;
      getProfile(auth.user.id).then(setProfile);
    }, [auth.user?.id])
  );

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Anonymous';

  const percentAccurate = stats.answered === 0
    ? 0
    : Math.round((stats.correct / stats.answered) * 100);

    return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatar}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={styles.avatarPlaceholder}>👤</Text>
        )}
      </View>

      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{auth.user?.email}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statNumber}>{stats.answered}</Text>
          <Text style={styles.statLabel}>Questions{'\n'}Answered</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNumber}>{stats.correct}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNumber}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNumber}>{percentAccurate}%</Text>
          <Text style={styles.statLabel}>Percent{'\n'}Accurate</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Statistics')}>
        <Image source={require('../assets/vectors/Stats.png')} style={styles.buttonIcon} resizeMode="contain" />
        <Text style={styles.buttonText}>View Full Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EditProfile', {
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
        })}
      >
        <Image source={require('../assets/vectors/Edit.png')} style={styles.buttonIcon} resizeMode="contain" />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Settings')}>
        <Image source={require('../assets/vectors/Setting.png')} style={styles.buttonIcon} resizeMode="contain" />
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>

    </LinearGradient>
  );

}

const styles = StyleSheet.create({
    
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: { 
        color: colors.white,
        fontSize: 20,
        fontWeight: 'bold' 
    },
    button: {
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.primaryGreen,
        paddingVertical: 15,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        margin: 10,
        
    },
    buttonIcon: { width: 25, height: 25, marginRight: 10 },
    buttonText: {
        color: colors.primaryGreen,
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    container: { flex: 1, alignItems: 'center', padding: 20 },
    header: { width: '100%', flexDirection: 'row', paddingBottom: 15 },

    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.grayLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      marginBottom: 16,
      overflow: 'hidden',
    },
    avatarImage: { width: 120, height: 120 },
    avatarPlaceholder: { fontSize: 48 },

    name: { fontSize: 22, fontFamily: fonts.bold, color: colors.black },
    email: { fontSize: 14, fontFamily: fonts.regular, color: colors.gray, marginBottom: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30, gap: 10, },
    statPill: {
        width: 80,
        height: 80,
        borderRadius: 38,
        backgroundColor: colors.primaryGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: { color: colors.white, fontSize: 14, fontFamily: fonts.bold },
    statLabel: { color: colors.white, fontSize: 12, fontFamily: fonts.regular, textAlign: 'center' },
});
