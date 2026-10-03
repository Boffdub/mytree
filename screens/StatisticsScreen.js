import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useAuthContext } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { getLeaderboard } from '../services/leaderboard';
import { calculateStreak, toLocalDayKey } from '../utils/streak';
import { treesEarnedFromCorrect } from '../utils/stats';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

const CATEGORY_ROWS = [
  [
    { label: 'Agriculture', icon: require('../assets/icons/Agriculture.png') },
    { label: 'Built Environment', icon: require('../assets/icons/Built_Environment.png') },
  ],
  [
    { label: 'Circular Economy', icon: require('../assets/icons/Circular_Economy.png') },
    { label: 'Climate Finance', icon: require('../assets/icons/Climate_Finance.png') },
  ],
  [
    { label: 'Corporate Sustainability', icon: require('../assets/icons/Corporate_Sustainability.png') },
    { label: 'Energy', icon: require('../assets/icons/Energy.png') },
  ],
  [
    { label: 'Food & Agriculture', icon: require('../assets/icons/Food_Agriculture.png') },
    { label: 'Fundamentals', icon: require('../assets/icons/Fundamentals.png') },
  ],
  [
    { label: 'Pop Culture', icon: require('../assets/icons/Pop_Culture.png') },
    { label: 'Science & Biodiversity', icon: require('../assets/icons/Science_Biodiversity.png') },
  ],
  [
    { label: 'Strategies in CDR', icon: require('../assets/icons/Strategies_in_CDR.png') },
    { label: 'Transportation', icon: require('../assets/icons/Transportation.png') },
  ],
];


const RANGES = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All-Time' },
];

const WEEKDAY_LABELS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];

function showComingSoon(feature) {
  const message = `${feature} is on the way in a future update.`;
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('Coming Soon', message);
}

// This week's Monday, as a local-time Date at midnight.
function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export default function StatisticsScreen({ navigation }) {
  const auth = useAuthContext();
  const [attempts, setAttempts] = useState([]);
  const [range, setRange] = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (!auth.user?.id) return;
      const storage = new StorageService(auth);
      storage.getAnsweredQuestions().then(setAttempts).catch(() => setAttempts([]));
    }, [auth.user?.id])
  );

  useFocusEffect(
    useCallback(() => {
      getLeaderboard(range).then(setLeaderboard).catch(() => setLeaderboard([]));
    }, [range])
  );

  const answered = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const percentAccurate = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const streak = calculateStreak(attempts.map((a) => a.answeredAt));
  const treesEarned = treesEarnedFromCorrect(correct);

  const myRank = leaderboard.find((row) => row.userId === auth.user?.id) ?? null;

  const activeDays = new Set(attempts.map((a) => toLocalDayKey(new Date(a.answeredAt))));
  const weekStart = startOfWeek(new Date());
  const weekDays = WEEKDAY_LABELS.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { label, active: activeDays.has(toLocalDayKey(d)) };
  });

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <ScreenHeader title="My Statistics" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{answered}</Text>
            <Text style={styles.statLabel}>Questions{'\n'}Answered</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{percentAccurate}%</Text>
            <Text style={styles.statLabel}>Percent{'\n'}Accurate</Text>
          </View>
        </View>

        <View style={styles.treesCard}>
            <Image source={require('../assets/vectors/Tree.png')} style={styles.treesIcon} resizeMode="contain" />
            <Text style={styles.treesNumber}>{treesEarned}</Text>
            <Text style={styles.treesLabel}>{treesEarned === 1 ? 'Tree Earned' : 'Trees Earned'}</Text>
        </View>

        <View style={styles.categoriesCard}>
          <Text style={styles.sectionTitle}>Categories Breakdown</Text>
          <Text style={styles.subHead}>Click the category and you will see how you did in each category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_ROWS.map((row, i) => (
            <View key={i} style={styles.categoryRow}>
              {row.map(({ label, icon }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.categoryItem}
                  onPress={() => showComingSoon('Category breakdown')}
                >
                  <Image source={icon} style={styles.categoryIcon} resizeMode="contain" />
                  <Text style={styles.categoryLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
              </View>
            ))}
            </View>
          </View>

    

        
        <View style={styles.barCard}>
          <View style={styles.questionsCard}>
            <Image source={require('../assets/vectors/Stats.png')} style={styles.buttonIcon} resizeMode="contain" />
            <View style={styles.totalQuestions}>
              <Text style={styles.numberQuestions}>{answered}</Text>
              <Text style={styles.sectionTitle}>Total Questions Answered</Text>
            </View>
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Correct</Text>
            <Text style={styles.barValueCorrect}>{correct}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barCorrect, { flex: correct || 0.001 }]} />
            <View style={[styles.barFill, styles.barCorrectRemainder, { flex: (answered - correct) || 0.001 }]} />
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Incorrect</Text>
            <Text style={styles.barValueIncorrect}>{answered - correct}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barIncorrect, { flex: (answered - correct) || 0.001 }]} />
            <View style={[styles.barFill, styles.barIncorrectRemainder, { flex: correct || 0.001 }]} />
          </View>

        </View>

        <View style={styles.barCard}>
          <Text style={styles.sectionTitle}>Current Streak</Text>
          <View style={styles.weekRow}>
            {weekDays.map(({ label, active }) => (
              <View key={label} style={styles.weekDayColumn}>
                <View style={[styles.weekDot, active && styles.weekDotActive]} />
                <Text style={styles.weekDayLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {myRank ? (
          <View style={styles.rankBanner}>
            <Text style={styles.rankBannerText}>Your Rank: #{myRank.rank}</Text>
            <Text style={styles.rankBannerSubtext}>{myRank.treesEarned} {myRank.treesEarned === 1 ? 'tree' : 'trees'} earned | {streak} {streak === 1 ? 'day' : 'days'} streak</Text>
          </View>
        ) : (
          <View style={styles.rankBanner}>
            <Text style={styles.rankBannerSubtext}>No activity yet in this time range</Text>
          </View>
        )}

        <View style={styles.barCard}>
          <Text style={styles.sectionTitle}>Global Leaderboard</Text>
          <View style={styles.toggleRow}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.toggleButton, range === r.key && styles.toggleButtonActive]}
                onPress={() => setRange(r.key)}
              >
                <Text style={[styles.toggleLabel, range === r.key && styles.toggleLabelActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {leaderboard.map((row) => (
            <View
              key={row.userId}
              style={[styles.leaderboardRow, row.userId === auth.user?.id && styles.leaderboardRowMe]}
            >
              <View style={styles.rankCircle}>
                <Text style={styles.leaderboardRank}>{row.rank}</Text>
              </View>
              <Text style={styles.leaderboardName}>{row.displayName}</Text>
              <View style={styles.leaderboardRight}>
                <Text style={styles.leaderboardTrees}>{row.treesEarned} {row.treesEarned === 1 ? 'tree' : 'trees'}</Text>
                <Text style={styles.leaderboardAccuracy}>{row.accuracy}% accurate</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Category')}
        >
          <Text style={styles.primaryButtonText}>Continue Learning</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
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

  treesNumber: { fontSize: 32, fontFamily: fonts.bold, color: colors.primaryGreen },
  treesLabel: { fontSize: 14, fontFamily: fonts.regular, color: colors.black, marginTop: 4 },
  treesIcon: { width: 32, height: 32, marginBottom: 6 },

  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.black,
    marginBottom: 5,
    textAlign: 'center',
  },
  subHead: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginBottom: 15,
  },
  categoriesCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.grayLight,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  categoryGrid: { rowGap: 14 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  categoryIcon: { width: 22, height: 22, marginRight: 6 },
  categoryLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.black, flexShrink: 1 },

  questionsCard: { flexDirection: 'row', alignItems: 'center', gap: 20,},
  totalQuestions: {alignItems: 'center', width: 250, },
  numberQuestions: { fontSize: 28, fontFamily: fonts.bold, }, 
  buttonIcon: { width: 45, height: 45,},

  treesCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.grayLight,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
  },

  barCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.grayLight,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'stretch',
    marginBottom: 20,
    padding: 15,
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 10, },
  barLabel: { fontSize: 14, fontFamily: fonts.regular, color: colors.black },
  barValueCorrect: { fontSize: 14, fontFamily: fonts.bold, color: colors.primaryGreen },
  barValueIncorrect: { fontSize: 14, fontFamily: fonts.bold, color: colors.primaryRed },
  barTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {height: '100%',},
  barCorrect: { backgroundColor: colors.primaryGreen },
  barCorrectRemainder: { backgroundColor: colors.lightGreen },
  barIncorrect: { backgroundColor: colors.primaryRed },
  barIncorrectRemainder: { backgroundColor: colors.lightRed },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 20, },
  weekDayColumn: { alignItems: 'center', marginTop: 20, },
  weekDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
    marginBottom: 6,
  },
  weekDotActive: { backgroundColor: colors.primaryGreen },
  weekDayLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.gray },

  rankBanner: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  rankBannerText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
  rankBannerSubtext: { fontSize: 13, fontFamily: fonts.regular, color: colors.white, marginTop: 2 },

  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toggleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleButtonActive: { backgroundColor: colors.primaryGreen },
  toggleLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.primaryGreen },
  toggleLabelActive: { color: colors.white },

  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRowMe: { borderWidth: 2, borderColor: colors.primaryGreen, backgroundColor: colors.lightGreen, },
  leaderboardRank: { fontSize: 14, fontFamily: fonts.bold, color: colors.white, },
  leaderboardName: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.black, flex: 1, },
  leaderboardRight: { alignItems: 'flex-end' },
  leaderboardTrees: { fontSize: 13, fontFamily: fonts.regular, color: colors.primaryGreen,  },
  leaderboardAccuracy: { fontSize: 11, fontFamily: fonts.regular, color: colors.gray },

  primaryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontFamily: fonts.bold },
});
