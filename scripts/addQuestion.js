// Simple script to help add questions to the database
// Run with: node scripts/addQuestion.js

const fs = require('fs');
const path = require('path');

// Template for adding a new question
const questionTemplate = {
  id: 0, // Will be auto-incremented
  question: "Your question here?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correct: 0, // Index of correct answer (0-3)
  difficulty: "Easy", // Easy, Medium, Hard
  explanation: "Explanation of the correct answer and why it's important.",
  source: "Source Name, Year",
  sourceUrl: "https://example.com/source",
  infographic: "filename.png", // Name of infographic file
  category: "energy" // energy, transportation, foodAgriculture, carbonRemoval
};

// Function to add a question
function addQuestion(category, questionData) {
  const questionsPath = path.join(__dirname, '../data/questions.js');
  
  // Read current questions
  const questionsContent = fs.readFileSync(questionsPath, 'utf8');
  
  // This is a simplified version - in practice, you'd want to parse the JS file properly
  console.log('To add a question:');
  console.log('1. Open data/questions.js');
  console.log('2. Find the category array you want to add to');
  console.log('3. Add your question object following this template:');
  console.log(JSON.stringify(questionTemplate, null, 2));
  console.log('\nMake sure to:');
  console.log('- Set the correct id (next number in sequence)');
  console.log('- Set correct answer index (0-3)');
  console.log('- Add your infographic file to assets/infographics/');
  console.log('- Update the infographic filename');
}

// Example usage
console.log('Question Database Helper');
console.log('======================');
console.log('Current structure supports:');
console.log('- 4 categories: energy, transportation, foodAgriculture, carbonRemoval');
console.log('- Difficulty levels: Easy, Medium, Hard');
console.log('- Infographic support');
console.log('- Source URLs');
console.log('\nTo add a question, use the template above.');
