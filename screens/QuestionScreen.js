import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameContext } from '../context/GameContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

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

  return (
    <View style={styles.screenContainer}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>🏠</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.bodyContainer}>
        {currentQuestion ? (
          <>
            {/* Progress */}
            <Text style={styles.progressText}>
              Question {questionIndex + 1} of {quizSession.questions.length}
            </Text>

            {/* Lifeline buttons (only rendered when gated) */}
            {(lifelinesAvailable.includes('5050') || lifelinesAvailable.includes('shield')) && (
              <View style={styles.lifelineRow}>
                {lifelinesAvailable.includes('5050') && (
                  <TouchableOpacity
                    style={[styles.lifelineButton, used5050 && styles.lifelineButtonSpent]}
                    disabled={!canUse5050}
                    onPress={() => useLifeline('5050', questionIndex)}
                  >
                    <Text style={[styles.lifelineText, used5050 && styles.lifelineTextSpent]}>
                      50/50{used5050 ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                {lifelinesAvailable.includes('shield') && (
                  <TouchableOpacity
                    style={[
                      styles.lifelineButton,
                      usedShield && styles.lifelineButtonSpent,
                      shieldArmed && styles.lifelineButtonArmed,
                    ]}
                    disabled={!canUseShield}
                    onPress={() => useLifeline('shield', questionIndex)}
                  >
                    <Text style={[styles.lifelineText, usedShield && styles.lifelineTextSpent]}>
                      Shield{usedShield ? (shieldArmed ? ' 🛡' : ' ✓') : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Answer Options */}
            {currentQuestion.options.map((option, index) => {
              const isEliminated = eliminated.includes(index);
              if (isEliminated) return null;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.selectedOptionButton,
                  ]}
                  onPress={() => setSelectedAnswer(index)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedAnswer === index && styles.selectedOptionButtonText,
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
  placeholder: {
    width: 40,
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
    marginBottom: 14,
    gap: 10,
  },
  lifelineButton: {
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  lifelineButtonSpent: {
    borderColor: colors.gray,
    opacity: 0.5,
  },
  lifelineButtonArmed: {
    backgroundColor: '#CEE7CF',
  },
  lifelineText: {
    color: colors.primaryGreen,
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  lifelineTextSpent: {
    color: colors.gray,
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
