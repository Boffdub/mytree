import React from 'react';
import { useGameContext } from '../context/GameContext';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { getQuestionsByCategory } from '../data/questions';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

// Mapping function outside, before the component
const mapCategoryToKey = (displayName) => {
    // your mapping logic here
    const categoryMap = {
        "Energy": "energy",
        "Transportation": "transportation",
        "Food & Agriculture": "foodAgriculture",
        "Carbon Removal": "carbonRemoval"
    };
    return categoryMap[displayName] || displayName;
};

export default function QuestionScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { category } = route.params || { category: 'General' };

    // State for the current question (the question object you're showing)
    const [currentQuestion, setCurrentQuestion] = useState(null);

    // State for all questions in this category
    const [questions, setQuestions] = useState([]);

    // State for which answer the user selected (0, 1, 2, or 3, or null if nothing selected)
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    // State for which question number you're on (0 = first question)
    const [questionIndex, setQuestionIndex] = useState(0);

    const { score, startSession, currentSessionId } = useGameContext();

    useEffect(() => {
        const categoryKey = mapCategoryToKey(category);
        const categoryQuestions = getQuestionsByCategory(categoryKey);
        setQuestions(categoryQuestions);

        const indexFromRoute = route.params?.questionIndex ?? 0;
        setQuestionIndex(indexFromRoute);

        if (categoryQuestions.length > 0 && indexFromRoute < categoryQuestions.length) {
            setCurrentQuestion(categoryQuestions[indexFromRoute]);
            setSelectedAnswer(null);
        }

        // Start a new session when entering the first question (index 0)
        if (indexFromRoute === 0 && !currentSessionId) {
            startSession(categoryKey);
        }
    }, [category, route.params?.questionIndex]);

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
                        {/* Question Text */}
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                        
                        {/* Answer Options */}
                        {currentQuestion.options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    selectedAnswer === index && styles.selectedOptionButton
                                ]}
                                onPress={() => setSelectedAnswer(index)}
                            >
                                <Text style={[
                                    styles.optionButtonText,
                                    selectedAnswer === index && styles.selectedOptionButtonText
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Submit Button - only shows when an answer is selected */}
                        {selectedAnswer !== null && (
                            <TouchableOpacity 
                                style={styles.submitButton}
                                onPress={() => {
                                    navigation.navigate('TreeAnimation', {
                                        fromScore: score,
                                        isCorrect: selectedAnswer === currentQuestion.correct,
                                        question: currentQuestion,
                                        selectedAnswer: selectedAnswer,
                                        category: category,
                                        questions: questions,
                                        questionIndex: questionIndex
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
    // Main container - holds header and body
    screenContainer: {
        flex: 1,
    },
    
    // Green gradient header area
    headerContainer: {
        backgroundColor: colors.lightGreen,
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    
    // Header row with back button, title, placeholder
    header: {
        flexDirection: 'row',     // Lay out children horizontally
        alignItems: 'center',     // Center vertically
        justifyContent: 'space-between',  // Spread items apart
        width: '100%',
    },
    
    // Category title in header
    headerTitle: {
        fontSize: 20,
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#1E8F2D',
        fontFamily: fonts.bold,
    },
    
    // Empty view to balance the back button (centers the title)
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
    
    // White/light body area
    bodyContainer: {
        backgroundColor: colors.white,
        flex: 1,                  // Takes remaining space
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    
    // Question text
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E8F2D',
        marginBottom: 25,
        lineHeight: 30,
        fontFamily: fonts.bold,
    },
    
    // Answer option buttons
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
    
    // Loading state
    loadingText: {
        fontSize: 16,
        color: colors.gray,
        textAlign: 'center',
        fontFamily: fonts.regular,
    },
});
