import React, { createContext, useState, useContext } from 'react';

// Create the context - this will hold our score globally
const AppContext = createContext();

// This is a custom hook that makes it easy to use the context
// Instead of importing useContext and AppContext, you just use useAppContext()
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// This component wraps the entire app and provides the score to all screens
export const AppProvider = ({ children }) => {
  // Start with score of 0
  const [score, setScore] = useState(0);

  // Function to add points when user answers correctly
  // Each correct answer adds 1 point
  const MAX_SCORE = 5;

  const incrementScore = () => {
    setScore(prev => Math.min(prev + 1, MAX_SCORE));
  };

  // Function to subtract points when user answers incorrectly
  // Each wrong answer subtracts 1 point
  const decrementScore = () => {
    setScore(prev => Math.max(prev - 1, 0)); // Don't go below 0
  };

  // Function to reset score (useful for testing or starting fresh)
  const resetScore = () => {
    setScore(0);
  };

  // The value object contains everything we want to share across screens
  const value = {
    score,
    incrementScore,
    decrementScore,
    resetScore,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};