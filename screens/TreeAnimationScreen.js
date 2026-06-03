import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TreeComponent from '../components/TreeComponent';
import { useGameContext } from '../context/GameContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function TreeAnimationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { fromScore = 0, isCorrect, question, selectedAnswer, category, questionIndex } = route.params || {};
  const { incrementScore, decrementScore, quizSession, shouldShrink } = useGameContext();

  // Capture shield status once at mount — before any state changes triggered by this screen.
  // Using a ref prevents re-render loops when shouldShrink consumes the shield.
  const mountRef = useRef(null);
  if (mountRef.current === null) {
    const shielded = (quizSession?.shieldArmedForIndex ?? null) === questionIndex;
    const willShrink = !isCorrect && !shielded;
    const toScore = Math.max(0, Math.min(fromScore + (isCorrect ? 1 : willShrink ? -1 : 0), 5));
    mountRef.current = { shielded, willShrink, toScore };
  }
  const { willShrink, toScore } = mountRef.current;

  const animValue = useRef(new Animated.Value(fromScore)).current;
  const [displayScore, setDisplayScore] = useState(fromScore);

  // Tracks whether we've already consumed the shield / fired score updates
  const hasActedRef = useRef(false);

  useEffect(() => {
    setDisplayScore(fromScore);
    animValue.setValue(fromScore);

    const finish = () => {
      if (hasActedRef.current) return;
      hasActedRef.current = true;

      // Consume the shield from context (side effect only; willShrink was captured at mount).
      shouldShrink(questionIndex, isCorrect);

      if (isCorrect) {
        incrementScore();
      } else if (willShrink) {
        decrementScore();
      }

      navigation.navigate('Answer', {
        question,
        selectedAnswer,
        category,
        questionIndex,
        scoreAlreadyUpdated: true,
      });
    };

    if (fromScore === toScore) {
      finish();
      return;
    }

    const listenerId = animValue.addListener(({ value }) => {
      setDisplayScore(value);
    });
    Animated.timing(animValue, {
      toValue: toScore,
      duration: 2200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) finish();
    });
    return () => {
      animValue.removeListener(listenerId);
      animValue.stopAnimation();
    };
    // fromScore and toScore are stable (toScore from a ref); isCorrect/willShrink don't change.
  }, [fromScore, toScore, isCorrect, willShrink]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20,
      paddingBottom: 10,
      backgroundColor: colors.lightGreenTransparent,
      fontFamily: fonts.bold,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1E8F2D',
      marginBottom: 5,
      fontFamily: fonts.bold,
    },
    headerSpacer: {
      width: 40,
    },
    treeWrapper: {
      flex: 1,
      width: '100%',
      justifyContent: 'flex-end',
      paddingBottom: 0,
      alignItems: 'center',
      paddingVertical: 20,
    },
    ground: {
      width: '100%',
      backgroundColor: colors.treeTrunk,
      paddingVertical: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    instructionText: {
      fontSize: 14,
      color: colors.white,
      textAlign: 'center',
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
      fontWeight: 'bold',
      fontFamily: fonts.bold,
    },
  });

  return (
    <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.backButton} />
        <Text style={styles.title}>My Tree</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.treeWrapper}>
        <TreeComponent animatedValue={animValue} showGround={false} />
      </View>

      <View style={styles.ground}>
        <Text style={styles.instructionText}>
          Every question you get right, your tree grows an inch. Every question you get wrong, it shrinks.
        </Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>Score: {Math.round(displayScore)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
