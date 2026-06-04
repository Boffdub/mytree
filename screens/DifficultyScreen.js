import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameContext } from '../context/GameContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

const DIFFICULTIES = [
  { label: 'Easy', description: '50/50 + Shield lifelines' },
  { label: 'Medium', description: '50/50 lifeline' },
  { label: 'Hard', description: '50/50 lifeline' },
];

export default function DifficultyScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { category } = route.params || {};
  const { startQuiz } = useGameContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset transient state whenever this screen regains focus (e.g. back from Question),
  // so the buttons aren't left disabled by a stale loading flag.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(false);
      setError(null);
    });
    return unsubscribe;
  }, [navigation]);

  const handlePick = async (difficulty) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const sessionId = await startQuiz(category, difficulty);
    if (!sessionId) {
      // startQuiz failed to open a session; submitting would be impossible, so don't advance.
      setError('Could not start the quiz. Please check your connection and try again.');
      setLoading(false);
      return;
    }
    navigation.navigate('Question', { category, questionIndex: 0 });
  };

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.description}>Choose a difficulty to start your quiz.</Text>

        {DIFFICULTIES.map(({ label, description }) => (
          <TouchableOpacity
            key={label}
            style={styles.difficultyButton}
            onPress={() => handlePick(label)}
            disabled={loading}
          >
            <Text style={styles.difficultyLabel}>{label}</Text>
            <Text style={styles.difficultyDescription}>{description}</Text>
          </TouchableOpacity>
        ))}

        {loading && <ActivityIndicator color={colors.primaryGreen} style={styles.spinner} />}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E8F2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E8F2D',
    fontFamily: fonts.bold,
  },
  placeholder: {
    width: 40,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  difficultyButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  difficultyLabel: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  difficultyDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  spinner: {
    marginTop: 20,
  },
  errorText: {
    color: colors.errorRed,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
});
