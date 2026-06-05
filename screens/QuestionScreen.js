import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameContext } from '../context/GameContext';
import { shouldClearSelection } from '../data/quiz';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';
import ScoreBadge from '../components/ScoreBadge';

export default function QuestionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { category } = route.params || {};
  const questionIndex = route.params?.questionIndex ?? 0;

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const { score, quizSession, useLifeline, currentSessionId } = useGameContext();

  // Reset selected answer whenever the question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [questionIndex]);

  const currentQuestion = quizSession.questions[questionIndex] ?? null;
  const eliminated = quizSession.eliminatedByIndex[questionIndex] ?? [];

  const lifelinesAvailable = quizSession.lifelinesAvailable;
  const lifelinesUsed = quizSession.lifelinesUsed;

  const canUse5050 = lifelinesAvailable.includes('5050') && !lifelinesUsed['5050'];
  const canUseShield = lifelinesAvailable.includes('shield') && !lifelinesUsed.shield;
  const used5050 = lifelinesUsed['5050'];
  const usedShield = lifelinesUsed.shield;
  const shieldArmed = quizSession.shieldArmedForIndex === questionIndex;

  // Clear selection if 50/50 eliminates the currently selected option
  useEffect(() => {
    if (shouldClearSelection(selectedAnswer, eliminated)) {
      setSelectedAnswer(null);
    }
  }, [eliminated]);

  const show5050Banner = !!quizSession.eliminatedByIndex[questionIndex];
  const showShieldBanner = shieldArmed;

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>🏠</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category}</Text>
          <ScoreBadge score={score} />
        </View>
      </View>

      <View style={styles.bodyContainer}>
        {currentQuestion ? (
          <>
            {/* Progress */}
            <Text style={styles.progressText}>
              Question {questionIndex + 1} of {quizSession.questions.length}
            </Text>

            {/* Lifeline tiles (only rendered when gated) */}
            {(lifelinesAvailable.includes('5050') || lifelinesAvailable.includes('shield')) && (
              <View style={styles.lifelineRow}>
                {lifelinesAvailable.includes('5050') && (
                  <TouchableOpacity
                    style={styles.tilePressable}
                    disabled={!canUse5050}
                    onPress={() => useLifeline('5050', questionIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.tileBox,
                      used5050 ? styles.tileBoxSpent : styles.tileBoxAvailable,
                    ]}>
                      <Text style={[styles.tileIcon, used5050 && styles.tileIconSpent]}>
                        50/50
                      </Text>
                    </View>
                    <Text style={[styles.tileLabel, used5050 && styles.tileLabelSpent]}>
                      50/50
                    </Text>
                  </TouchableOpacity>
                )}
                {lifelinesAvailable.includes('shield') && (
                  <TouchableOpacity
                    style={styles.tilePressable}
                    disabled={!canUseShield}
                    onPress={() => useLifeline('shield', questionIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.tileBox,
                      usedShield ? styles.tileBoxSpent : shieldArmed ? styles.tileBoxArmed : styles.tileBoxAvailable,
                    ]}>
                      <Text style={[styles.tileIcon, usedShield && styles.tileIconSpent]}>
                        🛡
                      </Text>
                    </View>
                    <Text style={[styles.tileLabel, usedShield && styles.tileLabelSpent]}>
                      Shield
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Contextual banners */}
            {(show5050Banner || showShieldBanner) && (
              <View style={styles.bannerContainer}>
                {show5050Banner && (
                  <Text style={styles.bannerText}>✓ 50/50 used — 2 answers removed</Text>
                )}
                {showShieldBanner && (
                  <Text style={styles.bannerText}>🛡 Shield Active — Your tree is protected!</Text>
                )}
              </View>
            )}

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Answer Options */}
            {currentQuestion.options.map((option, index) => {
              const isEliminated = eliminated.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.selectedOptionButton,
                    isEliminated && styles.eliminatedOptionButton,
                  ]}
                  disabled={isEliminated}
                  onPress={() => setSelectedAnswer(index)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedAnswer === index && styles.selectedOptionButtonText,
                      isEliminated && styles.eliminatedOptionButtonText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Submit Button */}
            {selectedAnswer !== null && (
              <TouchableOpacity
                style={[styles.submitButton, !currentSessionId && styles.submitButtonDisabled]}
                disabled={!currentSessionId}
                onPress={() => {
                  navigation.navigate('TreeAnimation', {
                    fromScore: score,
                    isCorrect: selectedAnswer === currentQuestion.correct,
                    question: currentQuestion,
                    selectedAnswer,
                    category,
                    questionIndex,
                  });
                }}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.loadingText}>Loading question...</Text>
        )}
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
  headerTitle: {
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1E8F2D',
    fontFamily: fonts.bold,
  },
  homeButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    fontSize: 22,
  },
  bodyContainer: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  lifelineRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  tilePressable: {
    alignItems: 'center',
  },
  tileBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBoxAvailable: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.white,
  },
  tileBoxSpent: {
    borderColor: colors.gray,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
  tileBoxArmed: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.lightGreen,
  },
  tileIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
  },
  tileIconSpent: {
    color: colors.gray,
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primaryGreen,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  tileLabelSpent: {
    color: colors.gray,
  },
  bannerContainer: {
    backgroundColor: colors.lightGreen,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 4,
  },
  bannerText: {
    fontSize: 13,
    color: colors.primaryGreen,
    fontFamily: fonts.regular,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E8F2D',
    marginBottom: 25,
    lineHeight: 30,
    fontFamily: fonts.bold,
  },
  optionButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#CEE7CF',
    borderColor: '#1E8F2D',
  },
  eliminatedOptionButton: {
    borderColor: colors.gray,
    backgroundColor: colors.grayLight,
    opacity: 0.5,
  },
  optionButtonText: {
    color: '#1E8F2D',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.semiBold,
  },
  selectedOptionButtonText: {
    color: colors.primaryGreen,
    fontFamily: fonts.semiBold,
  },
  eliminatedOptionButtonText: {
    color: colors.gray,
  },
  submitButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
