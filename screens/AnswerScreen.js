import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameContext } from "../context/GameContext";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthContext } from "../context/AuthContext";
import { StorageService } from "../services/storage";
import { calculateStreak } from "../utils/streak";

export default function AnswerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const {
    question,
    selectedAnswer,
    difficulty,
    questions,
    questionIndex,
    scoreAlreadyUpdated,
  } = route.params || {};
  const {
    score,
    incrementScore,
    decrementScore,
    saveAnswer,
    completeSession,
    correctStreak,
  } = useGameContext();

  const auth = useAuthContext();
  const [showExplanation, setShowExplanation] = useState(false);
  const [dayStreak, setDayStreak] = useState(0);

  // Track which questions we've already scored to prevent double-counting
  const scoredQuestionsRef = useRef(new Set());

  // Check if the selected answer matches the correct answer
  const isCorrect =
    question && selectedAnswer !== null && selectedAnswer === question.correct;
  // Check if there's a next question
  const hasNextQuestion =
    questions && questionIndex !== null && questionIndex + 1 < questions.length;
  const nextQuestionIndex = hasNextQuestion ? questionIndex + 1 : null;
  // Get answer texts
  const selectedAnswerText =
    question && selectedAnswer !== null
      ? question.options[selectedAnswer]
      : null;
  const correctAnswerText = question
    ? question.options[question.correct]
    : null;
  const correctAnswerIndex = question ? question.correct : null;

  useEffect(() => {
    const questionKey = question
      ? `${difficulty}-${question.id}-${questionIndex}`
      : null;

    if (
      question &&
      selectedAnswer !== null &&
      questionKey &&
      !scoredQuestionsRef.current.has(questionKey)
    ) {
      scoredQuestionsRef.current.add(questionKey);

      const persist = async () => {
        await saveAnswer(
          question.category,
          question.id,
          selectedAnswer,
          isCorrect,
        );
        if (!scoreAlreadyUpdated) {
          if (isCorrect) {
            await incrementScore();
          } else {
            await decrementScore();
          }
        }
        if (!hasNextQuestion) {
          await completeSession();
        }
      };
      persist().catch((err) =>
        console.error("[AnswerScreen] persist failed:", err),
      );
    }
  }, [
    question?.id,
    questionIndex,
    difficulty,
    selectedAnswer,
    isCorrect,
    incrementScore,
    decrementScore,
    scoreAlreadyUpdated,
    saveAnswer,
    completeSession,
    hasNextQuestion,
  ]);
  useEffect(() => {
    if (!auth.user?.id) return;
    const storage = new StorageService(auth);
    storage
      .getAnsweredQuestions()
      .then((attempts) => {
        setDayStreak(calculateStreak(attempts.map((a) => a.answeredAt)));
      })
      .catch(() => {});
  }, [auth.user?.id, question?.id, questionIndex]);

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.screenContainer}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {question ? (
            <>
              {/* Result Banner */}
              <View
                style={[
                  styles.resultBanner,
                  isCorrect ? styles.correctBanner : styles.incorrectBanner,
                ]}
              >
                <Text style={styles.resultText}>
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </Text>
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>{question.question}</Text>

              {/* Answer Display */}
              {question && selectedAnswerText && correctAnswerText && (
                <View style={styles.answerDisplayContainer}>
                  {isCorrect ? (
                    // If correct, show answer once in green
                    <View style={[styles.answerBox, styles.correctAnswerBox]}>
                      <View style={styles.answerLetterCircle}>
                        <Text style={styles.answerLetterText}>
                          {String.fromCharCode(65 + correctAnswerIndex)}
                        </Text>
                      </View>
                      <Text style={styles.correctAnswerText}>
                        {correctAnswerText}
                      </Text>
                    </View>
                  ) : (
                    // If incorrect, show both answers
                    <>
                      <View
                        style={[styles.answerBox, styles.incorrectAnswerBox]}
                      >
                        <View style={styles.answerLetterCircleIncorrect}>
                          <Text style={styles.answerLetterTextIncorrect}>
                            {String.fromCharCode(65 + selectedAnswer)}
                          </Text>
                        </View>
                        <Text style={styles.incorrectAnswerText}>
                          Your Answer: {selectedAnswerText}
                        </Text>
                      </View>
                      <View style={[styles.answerBox, styles.correctAnswerBox]}>
                        <View style={styles.answerLetterCircle}>
                          <Text style={styles.answerLetterText}>
                            {String.fromCharCode(65 + correctAnswerIndex)}
                          </Text>
                        </View>
                        <Text style={styles.correctAnswerText}>
                          Correct Answer: {correctAnswerText}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Infographic Placeholder */}
              <View style={styles.infographicPlaceholder}>
                <Text style={styles.infographicText}>Visual</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (question.sourceUrl) Linking.openURL(question.sourceUrl);
                }}
              >
                <Text style={styles.sourceText}>Source: {question.source}</Text>
              </TouchableOpacity>

              {/* Explanation */}
              <TouchableOpacity
                style={styles.explanationToggle}
                onPress={() => setShowExplanation(!showExplanation)}
              >
                <Text style={styles.explanationToggleText}>
                  Why is this the answer?
                </Text>
                <Text style={styles.explanationToggleArrow}>
                  {showExplanation ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showExplanation && (
                <>
                  <Text style={styles.explanationText}>
                    {question.question}
                  </Text>
                  <Text style={styles.explanationText}>
                    {question.explanation}
                  </Text>
                </>
              )}

              <View style={styles.statRow}>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Score</Text>
                  <Text style={styles.statValue}>{score}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Streak</Text>
                  <Text style={styles.statValue}>+{correctStreak}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Day Streak</Text>
                  <Text style={styles.statValue}>{dayStreak}</Text>
                </View>
              </View>

              {/* Navigation Buttons */}
              {hasNextQuestion ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => {
                    navigation.navigate("Question", {
                      difficulty,
                      questions,
                      questionIndex: nextQuestionIndex,
                    });
                  }}
                >
                  <Text style={styles.nextButtonText}>Next Question →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Text style={styles.nextButtonText}>🏠 Home</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.loadingText}>No question data available</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.grayLight,
    padding: 20,
    marginBottom: 20,
    width: "95%",
  },
  resultBanner: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  correctBanner: {
    backgroundColor: colors.primaryGreen,
  },
  incorrectBanner: {
    backgroundColor: colors.primaryRed,
  },
  resultText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: fonts.bold,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.black,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 24,
    fontFamily: fonts.bold,
  },
  answerDisplayContainer: {
    width: "100%",
    marginBottom: 20,
  },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
  },
  correctAnswerBox: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primaryGreen,
  },
  answerLetterCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  answerLetterText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: fonts.bold,
  },
  correctAnswerText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    fontFamily: fonts.bold,
  },
  incorrectAnswerBox: {
    backgroundColor: colors.lightRed,
    borderColor: colors.primaryRed,
  },
  answerLetterCircleIncorrect: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  answerLetterTextIncorrect: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: fonts.bold,
  },
  incorrectAnswerText: {
    color: colors.primaryRed,
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    fontFamily: fonts.bold,
  },
  infographicPlaceholder: {
    backgroundColor: colors.grayLight,
    width: "100%",
    height: 150,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  infographicText: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.semiBold,
  },
  explanationText: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  explanationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.lightGreen,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 10,
    width: "100%",
  },
  explanationToggleText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.black,
  },
  explanationToggleArrow: {
    fontSize: 13,
    color: colors.black,
  },
  statRow: {
    flexDirection: "row",
    backgroundColor: colors.lightGreen,
    borderRadius: 15,
    paddingVertical: 14,
    marginBottom: 20,
    width: "100%",
  },
  statColumn: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: colors.white },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.black,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryGreen,
  },
  sourceText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: "italic",
    marginBottom: 20,
    fontFamily: fonts.regular,
  },
  nextButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: "center",
    width: "100%",
  },
  nextButtonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
