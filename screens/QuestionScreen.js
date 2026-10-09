import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useGameContext } from "../context/GameContext";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getShuffledQuestionsByDifficulty } from "../data/questions";
import { CATEGORY_INFO } from "../constants/categories";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";

function showComingSoon(feature) {
  const message = `${feature} is on the way in a future update`;
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Coming Soon", message);
}

// Which lifelines show at each difficulty. Easy has no Shield and no tree
// shrinking, so it has no Shield icon here either - see Difficulty screen.
function lifelinesFor(difficulty) {
  const base = [
    {
      key: "fiftyFifty",
      label: "50/50",
      icon: require("../assets/vectors/5050.png"),
    },
    {
      key: "visualReveal",
      label: "Visual Reveal",
      icon: require("../assets/vectors/infographic.png"),
    },
  ];
  if (difficulty === "Medium") {
    return [
      ...base,
      {
        key: "shield",
        label: "Shield",
        icon: require("../assets/vectors/shield.png"),
        count: 3,
      },
    ];
  }
  if (difficulty === "Hard") {
    return [
      ...base,
      {
        key: "shield",
        label: "Shield",
        icon: require("../assets/vectors/shield.png"),
        count: 1,
      },
    ];
  }
  return base;
}

export default function QuestionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const difficulty = route.params?.difficulty ?? "Easy";

  // State for the current question (the question object you're showing)
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // State for all questions in this quiz
  const [questions, setQuestions] = useState([]);

  // State for which answer the user selected (0, 1, 2, or 3, or null if nothing selected)
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // State for which question number you're on (0 = first question)
  const [questionIndex, setQuestionIndex] = useState(0);

  // If session creation hasn't finished (or failed) after a few seconds, let the user
  // proceed anyway rather than leaving Submit disabled with no way forward - that one
  // session's stats may not get saved, which is a much smaller problem than a stuck quiz.
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  const { score, startSession, currentSessionId } = useGameContext();
  const category = currentQuestion
    ? CATEGORY_INFO[currentQuestion.category]
    : null;
  const lifelines = lifelinesFor(difficulty);

  useEffect(() => {
    const indexFromRoute = route.params?.questionIndex ?? 0;
    // Build the shuffled list once; later screens pass it along
    const pool =
      route.params?.questions ?? getShuffledQuestionsByDifficulty(difficulty);
    setQuestions(pool);
    setQuestionIndex(indexFromRoute);

    if (pool.length > 0 && indexFromRoute < pool.length) {
      setCurrentQuestion(pool[indexFromRoute]);
      setSelectedAnswer(null);
    }

    // Start a new session when entering the first question (index 0)
    if (indexFromRoute === 0 && !currentSessionId) {
      startSession(difficulty);
    }

    // Start a new session when entering the first question (index 0)
    if (indexFromRoute === 0 && !currentSessionId) {
      startSession(difficulty);
    }
  }, [difficulty, route.params?.questionIndex]);

  useEffect(() => {
    if (currentSessionId) {
      setSessionTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setSessionTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, [currentSessionId, difficulty, route.params?.questionIndex]);

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.screenContainer}
    >
      <View style={[styles.topRow, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bodyContainer}>
        {currentQuestion ? (
          <>
            {category && (
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconCircle}>
                  <Image
                    source={category.icon}
                    style={styles.categoryIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
            )}

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Answer Options */}
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedAnswer(index)}
              >
                <View style={styles.optionLetterCircle}>
                  <Text style={styles.optionLetterText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={styles.optionButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}

            {/* Submit Button - only shows when an answer is selected and session is ready */}
            {selectedAnswer !== null && (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !currentSessionId &&
                    !sessionTimedOut &&
                    styles.submitButtonDisabled,
                ]}
                disabled={!currentSessionId && !sessionTimedOut}
                onPress={() => {
                  navigation.navigate("TreeAnimation", {
                    fromScore: score,
                    isCorrect: selectedAnswer === currentQuestion.correct,
                    question: currentQuestion,
                    selectedAnswer,
                    difficulty: difficulty,
                    questions: questions,
                    questionIndex: questionIndex,
                  });
                }}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            )}

            {/* Lifelines - icons only for now, tapping shows a stub until they're built */}
            <View style={styles.lifelineRow}>
              {lifelines.map((lifeline) => (
                <TouchableOpacity
                  key={lifeline.key}
                  style={styles.lifelineButton}
                  onPress={() => showComingSoon(lifeline.label)}
                >
                  <Image
                    source={lifeline.icon}
                    style={styles.lifelineIcon}
                    resizeMode="contain"
                  />
                  {lifeline.count != null && (
                    <View style={styles.lifelineBadge}>
                      <Text style={styles.lifelineBadgeText}>
                        {lifeline.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>Score: {score}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.loadingText}>Loading question...</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Main container - holds header and body
  screenContainer: {
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  homeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  homeButtonText: {
    fontSize: 22,
  },
  // White/light body area
  bodyContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    borderColor: colors.grayLight,
    boxShadow: "0px 5px 5px rgba(0, 0, 0, 0.25)",
    borderStyle: "solid",
    borderWidth: 5,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryHeader: {
    alignItems: "center",
    marginBottom: 5,
  },
  categoryIconCircle: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    width: 35,
    height: 35,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.black,
    lineHeight: 13,
  },

  // Question text
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primaryGreen,
    marginBottom: 20,
    lineHeight: 27,
    fontFamily: fonts.bold,
  },
  // Answer option buttons
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
  },
  optionButtonSelected: {
    borderColor: colors.selectedYellow,
    borderWidth: 2,
  },
  optionLetterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionLetterText: {
    color: colors.black,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  optionButtonText: {
    color: colors.black,
    fontSize: 16,
    fontFamily: fonts.bold,
    flexShrink: 1,
  },

  submitButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  },

  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: fonts.bold,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  lifelineRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 20,
  },
  lifelineButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  lifelineIcon: {
    width: 40,
    height: 40,
  },
  lifelineBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  lifelineBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  scoreBadge: {
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
  },
  scoreBadgeText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  // Loading state
  loadingText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
