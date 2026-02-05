// Question Database for MyTree Climate Trivia App
// Structure designed for easy addition of questions, sources, and infographics

export const questions = {
  energy: [
    {
      id: 1,
      question: "What was the biggest global contributor to greenhouse gas emissions in 2023?",
      options: ["Transportation", "Power", "Agriculture", "Industry"],
      correct: 1, // index of correct answer (0-based)
      difficulty: "Easy",
      explanation: "Renewable energy sources now provide about 25% of global electricity, with solar and wind leading the growth.",
      source: "Statista, 2023",
      sourceUrl: "https://www.statista.com/statistics/241756/proportion-of-energy-in-global-greenhouse-gas-emissions/",
      infographic: "energy_renewable_percentage.png", // filename for infographic
      category: "energy"
    },
    {
      id: 2,
      question: "How many people die due to burning fossil fuels?",
      options: ["3 M", "3.3 M", "3.6 M", "4 M"],
      correct: 2,
      difficulty: "Medium",
      explanation: "Solar energy has experienced the fastest growth, with costs dropping by 85% since 2010 and capacity increasing dramatically.",
      source: "Our World In Data, 2021",
      sourceUrl: "https://ourworldindata.org/data-review-air-pollution-deaths",
      infographic: "solar_growth_chart.png",
      category: "energy"
    },
    {
      id: 3,
      question: "What time is electricity at it's peak demand in the summer? (all times are military)",
      options: ["900", "1200", "1500", "1600"],
      correct: 3,
      difficulty: "Medium",
      explanation: "Trains have the lowest carbon footprint per passenger kilometer, especially electric trains powered by renewable energy.",
      source: "Let's Talk Science, 2019",
      sourceUrl: "https://letstalkscience.ca/educational-resources/backgrounders/understanding-electricity-supply-and-demand",
      infographic: "transport_carbon_footprint.png",
      category: "energy"
    },
    {
      id: 4,
      question: "As of 2024, how has wind & solar energy usage compared to previous years?",
      options: ["Increased significantly", "Increased a little", "Decreased significantly", "Decreased a little"],
      correct: 0,
      difficulty: "Medium",
      explanation: "Trains have the lowest carbon footprint per passenger kilometer, especially electric trains powered by renewable energy.",
      source: "Enerdata, 2024",
      sourceUrl: "https://yearbook.enerdata.net/renewables/wind-solar-share-electricity-production.html",
      infographic: "transport_carbon_footprint.png",
      category: "energy"
    },
    {
      id: 5,
      question: "Which energy source has been installed the most in 2025?",
      options: ["Solar", "Coal", "Oil", "Natural Gas"],
      correct: 0,
      difficulty: "Medium",
      explanation: "The world's population has increased by 2.2 times since 1960.",
      source: "Science.org, 2025",
      sourceUrl: "https://www.science.org/content/article/breakthrough-2025",
      infographic: "transport_carbon_footprint.png",
      category: "energy"
    },
  ],

  transportation: [
    {
      id: 1,
      question: "Which country has sold the most electric vehicles (in 2024)?",
      options: ["USA", "China", "Vietnam", "Singapore"],
      correct: 3,
      difficulty: "Medium",
      explanation: "Trains have the lowest carbon footprint per passenger kilometer, especially electric trains powered by renewable energy.",
      source: "Ember, 2025",
      sourceUrl: "https://ember-energy.org/latest-insights/the-ev-leapfrog-how-emerging-markets-are-driving-a-global-ev-boom/",
      infographic: "transport_carbon_footprint.png",
      category: "transportation"
    },
    {
      id: 2,
      question: "How many countries had EVs representing more than 10% of new car sales in 2025?",
      options: ["4", "39","44", "52"],
      correct: 1,
      difficulty: "Medium",
      explanation: "This is a placeholder for now",
      source: "Ember, 2025",
      sourceUrl: "https://ember-energy.org/latest-updates/over-a-quarter-of-new-cars-sold-so-far-this-year-are-electric-as-emerging-markets-reshape-the-global-ev-race/",
      infographic: "transport_carbon_footprint.png",
      category: "transportation"
    },
    {
      id: 3,
      question: "What percentage of global greenhouse gas emissions does the aviation industry account for?",
      options: ["1%", "2-3%", "4-5%", "9-10%"],
      correct: 1,
      difficulty: "Medium",
      explanation: "This is a placeholder for now",
      source: "Our World In Data, 2024",
      sourceUrl: "https://ourworldindata.org/global-aviation-emissions",
      infographic: "transport.png",
      category: "transportation"
    },
    {
      id: 4,
      question: "By how much can Sustainable Aviation Fuel (SAF) reduce CO2 emissions compared to conventional jet fuel?",
      options: ["20-40", "41-60", "61-80", "81-100"],
      correct: 2,
      difficulty: "Hard",
      explanation: "This is a placeholder for now",
      source: "IATA, 2025",
      sourceUrl: "https://www.iata.org/en/programs/sustainability/sustainable-aviation-fuels/",
      infographic: "transport.png",
      category: "transportation"
    },
    {
      id: 5,
      question: "By how much can buses and trains reduce greenhouse gas emissions per passenger, per kilometer compared to private vehicles?",
      options: ["Up to one-quarter", "Up to one-thirds", "Up to one-half", "Up to two-thirds"],
      correct: 3,
      difficulty: "Medium",
      explanation: "This is a placeholder for now",
      source: "MIT, 2023",
      sourceUrl: "https://climate.mit.edu/explainers/public-transportation",
      infographic: "transport.png",
      category: "transportation"
    }
    // Add more transportation questions here...
  ],
  
  foodAgriculture: [
    {
      id: 1,
      question: "Of these 4 options, what produces the most greenhouse gas emissions?",
      options: ["Chicken", "Lamb", "Beef", "Pig"],
      correct: 2,
      difficulty: "Easy",
      explanation: "Food production accounts for approximately 25% of global greenhouse gas emissions, including agriculture, processing, and transportation.",
      source: "Our World In Data, 2025",
      sourceUrl: "https://ourworldindata.org/environmental-impacts-of-food",
      infographic: "food_emissions_breakdown.png",
      category: "foodAgriculture"
    },
    {
      id: 2,
      question: "What percentage of food system emissions comes from transportation ('food miles])?",
      options: ["About 5%", "About 15%", "About 20%", "About 25%"],
      correct: 0,
      difficulty: "Hard",
      explanation: "Food production accounts for approximately 25% of global greenhouse gas emissions, including agriculture, processing, and transportation.",
      source: "Our World In Data, 2020",
      sourceUrl: "https://ourworldindata.org/food-choice-vs-eating-local",
      infographic: "food_emissions_breakdown.png",
      category: "foodAgriculture"
    },
    {
      id: 3,
      question: "How much of global greenhouse gas emissions does food waste contribute?",
      options: ["2-3%", "5-7%", "8-10%", "12-15%"],
      correct: 2,
      difficulty: "Hard",
      explanation: "Food production accounts for approximately 25% of global greenhouse gas emissions, including agriculture, processing, and transportation.",
      source: "UC San Diego, 2025",
      sourceUrl: "https://today.ucsd.edu/story/how-food-waste-is-a-major-contributor-to-climate-change-and-what-are-the-solutions",
      infographic: "food_emissions_breakdown.png",
      category: "foodAgriculture"
    },
    {
      id: 4,
      question: "If food waste were a country, where would it rank among global greenhouse gas emitters?",
      options: ["1st", "3rd", "5th", "10th"],
      correct: 1,
      difficulty: "Hard",
      explanation: "Food production accounts for approximately 25% of global greenhouse gas emissions, including agriculture, processing, and transportation.",
      source: "UC San Diego, 2025",
      sourceUrl: "https://today.ucsd.edu/story/how-food-waste-is-a-major-contributor-to-climate-change-and-what-are-the-solutions",
      infographic: "food_emissions_breakdown.png",
      category: "foodAgriculture"
    },
    {
      id: 5,
      question: "What percentage is food responsible for global greenhouse house emissions?",
      options: ["14%", "18%", "24%", "26%"],
      correct: 3,
      difficulty: "Hard",
      explanation: "Food production accounts for approximately 25% of global greenhouse gas emissions, including agriculture, processing, and transportation.",
      source: "Our World In Data, 2019",
      sourceUrl: "https://ourworldindata.org/food-ghg-emissions",
      infographic: "food_emissions_breakdown.png",
      category: "foodAgriculture"
    }
    // Add more food & agriculture questions here...
  ],
  
  carbonRemoval: [
    {
      id: 1,
      question: "What percentage of human-caused CO2 emissions have the world's oceans absorbed since the Industrial Revolution?",
      options: ["About 10%", "About 20%", "About 30%", "About 40%"],
      correct: 2,
      difficulty: "Hard",
      explanation: "The ocean absorbs about 25% of human-caused CO2 emissions annually, making it the largest natural carbon sink.",
      source: "University ofColorado Boulder, 2025",
      sourceUrl: "https://www.colorado.edu/today/2025/04/29/ocean-may-be-absorbing-less-carbon-it-may-not-be-due-climate-change-yet",
      infographic: "ocean_carbon_cycle.png",
      category: "carbonRemoval"
    },
    {
      id: 2,
      question: "Despite covering only 3-13% of Earth's land surface, what percentage of global soil carbon do wetlands store?",
      options: ["Over 10%", "Over 20%", "Over 30%", "Over 40%"],
      correct: 2,
      difficulty: "Hard",
      explanation: "The ocean absorbs about 25% of human-caused CO2 emissions annually, making it the largest natural carbon sink.",
      source: "Phys.org, 2025",
      sourceUrl: "https://phys.org/news/2025-07-dynamic-dataset-reveals-role-wetlands.html",
      infographic: "ocean_carbon_cycle.png",
      category: "carbonRemoval"
    },
    {
      id: 3,
      question: "In 2023, during record-high ocean temperatures, how much less CO2 did the global ocean absorb than expected?",
      options: ["About 5% less", "About 10% less", "About 15% less", "About 20% less"],
      correct: 1,
      difficulty: "Hard",
      explanation: "The ocean absorbs about 25% of human-caused CO2 emissions annually, making it the largest natural carbon sink.",
      source: "The Breakthrough Institute, 2023",
      sourceUrl: "https://thebreakthrough.org/issues/food-agriculture-environment/livestock-dont-contribute-14-5-of-global-greenhouse-gas-emissions",
      infographic: "ocean_carbon_cycle.png",
      category: "carbonRemoval"
    },
    {
      id: 4,
      question: "From 2000-2020, what was the average annual global carbon sequestration by wetlands?",
      options: ["About 100 Million", "About 500 Million", "About 1 Billion", "About 5 Billion"],
      correct: 2,
      difficulty: "Hard",
      explanation: "The ocean absorbs about 25% of human-caused CO2 emissions annually, making it the largest natural carbon sink.",
      source: "Phys.org, 2025",
      sourceUrl: "https://phys.org/news/2025-07-dynamic-dataset-reveals-role-wetlands.html",
      infographic: "ocean_carbon_cycle.png",
      category: "carbonRemoval"
    },
    {
      id: 5,
      question: "How much carbon do the terrestrial wetlands in the continental United States store in total?",
      options: ["10.5 Billion Metrics", "13.5 Billion Metrics", "15.5 Billion Metrics", "18.5 Billion Metrics"],
      correct: 1,
      difficulty: "Hard",
      explanation: "The ocean absorbs about 25% of human-caused CO2 emissions annually, making it the largest natural carbon sink.",
      source: "Board of Water and Soil Resources, 2025",
      sourceUrl: "https://bwsr.state.mn.us/carbon-sequestration-wetlands",
      infographic: "ocean_carbon_cycle.png",
      category: "carbonRemoval"
    },
    // Add more carbon removal questions here...
  ]
};

// Helper functions for managing questions
export const getQuestionsByCategory = (category) => {
  return questions[category] || [];
};

export const getRandomQuestion = (category) => {
  const categoryQuestions = getQuestionsByCategory(category);
  if (categoryQuestions.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
  return categoryQuestions[randomIndex];
};

export const getQuestionById = (category, id) => {
  const categoryQuestions = getQuestionsByCategory(category);
  return categoryQuestions.find(q => q.id === id) || null;
};

// Get total question count
export const getTotalQuestionCount = () => {
  return Object.values(questions).reduce((total, category) => total + category.length, 0);
};

// Get question count by category
export const getQuestionCountByCategory = (category) => {
  return questions[category] ? questions[category].length : 0;
};
