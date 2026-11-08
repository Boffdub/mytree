import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import TreeComponent from "../components/TreeComponent";
import { useGameContext } from "../context/GameContext";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";

// Base layout for the confetti rays - same positions you already approved.
// x/y is the top-left position (in points, relative to the tree area's
// top-left corner) of the un-rotated line before rotating, length is its
// height, and angle is its rotation in degrees.
const RAY_BASES = [
  { x: 60, y: 40, length: 55, angle: 20 },
  { x: 150, y: 15, length: 45, angle: -15 },
  { x: 290, y: 35, length: 60, angle: 25 },
  { x: 340, y: 110, length: 45, angle: -10 },
  { x: 15, y: 180, length: 50, angle: -20 },
  { x: 330, y: 240, length: 55, angle: 15 },
  { x: 30, y: 340, length: 60, angle: -25 },
  { x: 320, y: 360, length: 50, angle: 20 },
  { x: 80, y: 440, length: 55, angle: -15 },
  { x: 260, y: 460, length: 45, angle: 20 },
];
const RAY_THICKNESS = 4;

function jitter(value, amount) {
  return value + (Math.random() * 2 - 1) * amount;
}

// Nudges each base ray's position/length/angle a little, and picks a random
// color for it, so every celebration looks slightly different without
// losing the overall scattered layout.
function generateConfetti() {
  return RAY_BASES.map((base) => ({
    x: jitter(base.x, 20),
    y: jitter(base.y, 20),
    length: jitter(base.length, 10),
    angle: jitter(base.angle, 15),
    color: Math.random() < 0.5 ? "yellow" : "pink",
  }));
}

export default function TreeAnimationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const {
    fromScore = 0,
    isCorrect,
    question,
    selectedAnswer,
    difficulty,
    questions,
    questionIndex,
    shieldArmed = false,
  } = route.params || {};
  const {
    incrementScore,
    decrementScore,
    incrementStreak,
    resetStreak,
    shieldsLeft,
    consumeShield,
    completeTree,
  } = useGameContext();

  // Easy never shrinks the tree at all. On Medium/Hard, a shield (if you have
  // one left) blocks the shrink too, but unlike Easy's blanket rule, a
  // shielded wrong answer also gets excluded from accuracy/leaderboard stats
  // (see AnswerScreen/saveAnswer) - Easy's wrong answers still count normally.
  const canShrink = difficulty !== "Easy";
  const isShielded = !isCorrect && canShrink && shieldArmed && shieldsLeft > 0;
  const willShrink = !isCorrect && canShrink && !isShielded;
  const delta = isCorrect ? 1 : willShrink ? -1 : 0;
  const toScore = Math.max(0, Math.min(fromScore + delta, 5));
  const justCompletedTree = isCorrect && fromScore < 5 && toScore === 5;

  const animValue = useRef(new Animated.Value(fromScore)).current;
  const [displayScore, setDisplayScore] = useState(fromScore);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rays, setRays] = useState(() => generateConfetti());

  useEffect(() => {
    setDisplayScore(fromScore);
    animValue.setValue(fromScore);

    const listenerId = animValue.addListener(({ value }) => {
      setDisplayScore(value);
    });
    Animated.timing(animValue, {
      toValue: toScore,
      duration: 3200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(async ({ finished }) => {
      if (!finished) return;

      let treesCompletedCount = null;
      if (isCorrect) {
        incrementScore();
        incrementStreak();
        if (justCompletedTree) {
          setRays(generateConfetti());
          setShowConfetti(true);
          treesCompletedCount = await completeTree();
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } else {
        resetStreak();
        if (isShielded) {
          consumeShield();
        } else if (willShrink) {
          decrementScore();
        }
      }
      navigation.navigate("Answer", {
        question,
        selectedAnswer,
        difficulty,
        questions,
        questionIndex,
        scoreAlreadyUpdated: true,
        isShielded,
        treeCompleted: justCompletedTree,
        treesCompletedCount,
      });
    });
    return () => {
      animValue.removeListener(listenerId);
      animValue.stopAnimation();
    };
    // Only re-run when the animation config changes. Omitting incrementScore, decrementScore,
    // navigation, question, etc. prevents the effect from re-running when context updates
    // after we call incrementScore(), which would cause an infinite loop.
  }, [
    fromScore,
    toScore,
    isCorrect,
    isShielded,
    willShrink,
    justCompletedTree,
  ]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 20,
      paddingBottom: 10,
      backgroundColor: colors.lightGreenTransparent,
      fontFamily: fonts.bold,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    backButtonText: {
      fontSize: 24,
      color: colors.black,
      fontWeight: "bold",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#1E8F2D",
      marginBottom: 5,
      fontFamily: fonts.bold,
    },
    headerSpacer: {
      width: 40,
    },
    treeWrapper: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-end",
      paddingBottom: 0,
      alignItems: "center",
      paddingVertical: 20,
    },
    confettiContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    rayLine: {
      position: "absolute",
      width: RAY_THICKNESS,
      borderRadius: RAY_THICKNESS / 2,
    },
    ground: {
      width: "100%",
      backgroundColor: colors.treeTrunk,
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    instructionText: {
      fontSize: 14,
      color: colors.white,
      textAlign: "center",
      paddingHorizontal: 8,
      marginBottom: 16,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    scoreBadge: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.primaryGreen,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    scoreBadgeText: {
      color: colors.primaryGreen,
      fontSize: 14,
      fontWeight: "bold",
      fontFamily: fonts.bold,
    },
  });

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.backButton} />
        <Text style={styles.title}>My Tree</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.treeWrapper}>
        <TreeComponent animatedValue={animValue} showGround={false} />
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {rays.map((ray, i) => (
              <View
                key={i}
                style={[
                  styles.rayLine,
                  {
                    left: ray.x,
                    top: ray.y,
                    height: ray.length,
                    backgroundColor:
                      ray.color === "yellow"
                        ? colors.sparkleYellow
                        : colors.celebrationPink,
                    transform: [{ rotate: `${ray.angle}deg` }],
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.ground}>
        <Text style={styles.instructionText}>
          Every question you get right, your tree grows an inch.
          {canShrink
            ? " Every question you get wrong, it shrinks."
            : " On Easy, wrong answers won't shrink your tree."}
        </Text>

        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>
            Score: {Math.round(displayScore)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
