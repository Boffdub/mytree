import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TreeComponent from '../components/TreeComponent';
import { useAppContext } from '../context/AppContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function TreeAnimationScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { fromScore = 0, isCorrect, question, selectedAnswer, category, questions, questionIndex } = route.params || {};
    const { incrementScore, decrementScore } = useAppContext();
    const toScore = Math.max(0, Math.min(fromScore + (isCorrect ? 1 : -1), 5));

    const animValue = useRef(new Animated.Value(fromScore)).current;
    const [displayScore, setDisplayScore] = useState(fromScore);

    useEffect(() => {
        setDisplayScore(fromScore);
        animValue.setValue(fromScore);

        if (fromScore === toScore) {
            if (isCorrect) {
                incrementScore();
            } else {
                decrementScore();
            }
            navigation.navigate('Answer', {
                question,
                selectedAnswer,
                category,
                questions,
                questionIndex,
                scoreAlreadyUpdated: true,
            });
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
            if (finished) {
                if (isCorrect) {
                    incrementScore();
                } else {
                    decrementScore();
                }
                navigation.navigate('Answer', {
                    question,
                    selectedAnswer,
                    category,
                    questions,
                    questionIndex,
                    scoreAlreadyUpdated: true,
                });
            }
        });
        return () => {
            animValue.removeListener(listenerId);
            animValue.stopAnimation();
        };
    // Only re-run when the animation config changes. Omitting incrementScore, decrementScore,
    // navigation, question, etc. prevents the effect from re-running when context updates
    // after we call incrementScore(), which would cause an infinite loop.
    }, [fromScore, toScore, isCorrect]);

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
        backButtonText: {
            fontSize: 24,
            color: colors.black,
            fontWeight: 'bold',
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
