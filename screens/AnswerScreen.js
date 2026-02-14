import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function AnswerScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { question, selectedAnswer, category, questions, questionIndex, scoreAlreadyUpdated } = route.params || {};
    const { score, incrementScore, decrementScore } = useAppContext();
    
    // Track which questions we've already scored to prevent double-counting
    const scoredQuestionsRef = useRef(new Set());
    
    // Check if the selected answer matches the correct answer
    const isCorrect = question && selectedAnswer !== null && selectedAnswer === question.correct;
    // Check if there's a next question
    const hasNextQuestion = questions && questionIndex !== null && questionIndex + 1 < questions.length;
    const nextQuestionIndex = hasNextQuestion ? questionIndex + 1 : null;
    // calculate progress
    const currentQuestionNumber = questionIndex != null ? questionIndex + 1 : 1;
    const totalQuestions = questions ? questions.length : 1;
    const progressPercentage = totalQuestions > 0 ? (currentQuestionNumber / totalQuestions) * 100 : 0;
    // Get answer texts
    const selectedAnswerText = question && selectedAnswer !== null 
    ? question.options[selectedAnswer] 
    : null;
    const correctAnswerText = question ? question.options[question.correct] : null;
    const correctAnswerIndex = question ? question.correct : null;
    
    // Update score when a new question is shown (only score each question once)
    useEffect(() => {
        if (scoreAlreadyUpdated) return;
        // Create a unique key for this question (category + question id)
        const questionKey = question ? `${category}-${question.id}-${questionIndex}` : null;
        
        if (question && selectedAnswer !== null && questionKey && !scoredQuestionsRef.current.has(questionKey)) {
            // Mark this question as scored
            scoredQuestionsRef.current.add(questionKey);
            
            // Update the score
            if (isCorrect) {
                incrementScore();
            } else {
                decrementScore();
            }
        }
    }, [question?.id, questionIndex, category, selectedAnswer, isCorrect, incrementScore, decrementScore, scoreAlreadyUpdated]);

    return (
        <View style={styles.screenContainer}>
            {/* Green Header */}
            <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{category || 'Answer'}</Text>
                </View>
            </View>
            
            {/* White Body */}
            <View style={styles.bodyContainer}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {/* Top Row: Question text and Score bad */}
                    <View style={styles.progressTopRow}>
                        <Text style={styles.progressText}>Question {currentQuestionNumber} of {totalQuestions}</Text>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>Score: {score}</Text>
                        </View>
                    </View>

                    {/* Bottom row: Progress bar (full width) */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                    {question ? (
                        <>
                            {/* Result Banner */}
                            <View style={[
                                styles.resultBanner,
                                isCorrect ? styles.correctBanner : styles.incorrectBanner
                            ]}>
                                <Text style={styles.resultText}>
                                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
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
                                            <Text style={styles.correctAnswerText}>{correctAnswerText}</Text>
                                        </View>
                                    ) : (
                                        // If incorrect, show both answers
                                        <>
                                            <View style={[styles.answerBox, styles.incorrectAnswerBox]}>
                                                <View style={styles.answerLetterCircleIncorrect}>
                                                    <Text style={styles.answerLetterTextIncorrect}>
                                                        {String.fromCharCode(65 + selectedAnswer)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.incorrectAnswerText}>Your Answer: {selectedAnswerText}</Text>
                                            </View>
                                            <View style={[styles.answerBox, styles.correctAnswerBox]}>
                                                <View style={styles.answerLetterCircle}>
                                                    <Text style={styles.answerLetterText}>
                                                        {String.fromCharCode(65 + correctAnswerIndex)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.correctAnswerText}>Correct Answer: {correctAnswerText}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}

                            {/* Infographic Placeholder */}
                            <View style={styles.infographicPlaceholder}>
                                <Text style={styles.infographicText}>Infographic</Text>
                            </View>

                            {/* Explanation */}
                            <Text style={styles.explanationTitle}>Explanation:</Text>
                            <Text style={styles.explanationText}>{question.explanation}</Text>

                            {/* Source */}
                            <Text style={styles.sourceText}>Source: {question.source}</Text>
                            
                            {/* Navigation Buttons */}
                            {hasNextQuestion ? (
                                <TouchableOpacity 
                                    style={styles.nextButton}
                                    onPress={() => {
                                        navigation.navigate('Question', {
                                            category: category,
                                            questionIndex: nextQuestionIndex
                                        });
                                    }}
                                >
                                    <Text style={styles.nextButtonText}>Next Question →</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity 
                                        style={styles.viewTreeButton}
                                        onPress={() => navigation.navigate('Category')}
                                    >
                                        <Text style={styles.viewTreeButtonText}>← Back to Category</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.viewTreeButton}
                                        onPress={() => navigation.navigate('Home')}
                                    >
                                        <Text style={styles.viewTreeButtonText}>🏠 Home</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Source Button */}
                            <TouchableOpacity 
                                style={styles.sourceButton}
                                onPress={() => {
                                    // TODO: Open source URL if available
                                    if (question && question.sourceUrl) {
                                        // You can use Linking.openURL(question.sourceUrl) here later
                                    }
                                }}
                            >
                                <Text style={styles.sourceButtonText}>Source</Text>
                            </TouchableOpacity>

                            {/* View Tree Button */}
                            <TouchableOpacity 
                                style={styles.viewTreeButton}
                                onPress={() => navigation.navigate('Tree')}
                            >
                                <Text style={styles.viewTreeButtonText}>🌲 View Tree</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.loadingText}>No question data available</Text>
                    )}
                </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        minHeight: 0,
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
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        color: colors.primaryGreen,
        fontFamily: fonts.bold,
    },
    bodyContainer: {
        flex: 1,
        minHeight: 0,
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingTop: 30,
        alignItems: 'center',
    },
    progressContainer: {
        width: '95%',
        marginBottom: 15,
    },
    progressTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        color: colors.black,
        fontFamily: fonts.regular,
    },
    scoreBadge: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#1E8F2D',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        color: colors.primaryGreen,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: colors.grayLight,
        borderRadius: 15,
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#1E8F2D',
        borderRadius: 15,
    },
    scrollView: {
        flex: 1,
        width: '100%',
        minHeight: 0,
    },
    scrollViewContent: {
        alignItems: 'center',
        paddingBottom: 40,
        flexGrow: 1,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: colors.grayPlaceholder,
        padding: 20,
        marginBottom: 20,
        width: '95%',
    },
    resultBanner: {
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 15,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    correctBanner: {
        backgroundColor: '#1E8F2D',
    },
    incorrectBanner: {
        backgroundColor: '#F44336',
    },
    resultText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.black,
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 24,
        fontFamily: fonts.bold,
    },
    answerDisplayContainer: {
        width: '100%',
        marginBottom: 20,
    },
    answerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 2,
    },
    correctAnswerBox: {
        backgroundColor: '#CEE7CF',
        borderColor: '#1E8F2D',
    },
    answerLetterCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#1E8F2D',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    answerLetterText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    correctAnswerText: {
        color: '#1E8F2D',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        fontFamily: fonts.bold,
    },
    incorrectAnswerBox: {
        backgroundColor: colors.errorRedLight,
        borderColor: colors.errorRed,
    },
    answerLetterCircleIncorrect: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.errorRed,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    answerLetterTextIncorrect: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    incorrectAnswerText: {
        color: colors.errorRed,
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        fontFamily: fonts.bold,
    },
    infographicPlaceholder: {
        backgroundColor: '#D9D9D9',
        width: '100%',
        height: 150,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    infographicText: {
        color: colors.gray,
        fontSize: 16,
        fontWeight: '500',
        fontFamily: fonts.semiBold,
    },
    explanationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E8F2D',
        marginBottom: 10,
        marginTop: 10,
        fontFamily: fonts.bold,
    },
    explanationText: {
        fontSize: 16,
        color: colors.black,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
        fontFamily: fonts.regular,
    },
    sourceText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
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
        alignItems: 'center',
        width: '100%',
    },
    nextButtonText: {
        color: '#1E8F2D',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sourceButton: {
        backgroundColor: colors.lightGreen,
        borderWidth: 2,
        borderColor: colors.primaryGreen,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 15,
        alignItems: 'center',
        width: '100%',
    },
    sourceButtonText: {
        color: '#1E8F20',
        fontSize: 16,
        fontWeight: 'bold',
    },
    viewTreeButton: {
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.primaryGreen,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 10,
        alignItems: 'center',
        width: '100%',
    },
    viewTreeButtonText: {
        color: '#1E8F2D',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    loadingText: {
        fontSize: 16,
        color: colors.gray,
        textAlign: 'center',
        fontFamily: fonts.regular,
    },
});
