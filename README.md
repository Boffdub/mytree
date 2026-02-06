# MyTree

A climate trivia quiz app built with React Native and Expo. Answer questions about climate topics to grow your virtual tree!

## 📱 What is MyTree?

MyTree is an educational mobile app that helps users learn about climate change through interactive quizzes. As you answer questions correctly, you grow a virtual tree that represents your learning journey.

### Features
- **Multiple Categories**: Answer questions across four climate categories:
  - 🌱 Energy
  - 🚗 Transportation
  - 🌾 Food & Agriculture
  - 🌍 Carbon Removal
- **Interactive Learning**: Each question includes explanations and sources
- **Visual Progress**: Watch your tree grow as you learn
- **Cross-Platform**: Works on iOS, Android, and Web

## 📁 Project Structure

Here's what each part of the project does:

```
MyTree/
├── App.js                    # Main app entry point - sets up navigation
├── app.json                  # Expo configuration (app name, icons, etc.)
├── index.js                  # App entry point
├── package.json              # Dependencies and scripts
│
├── screens/                   # All app screens
│   ├── HomeScreen.js         # Welcome/home screen
│   ├── CategoryScreen.js     # Category selection screen
│   ├── QuestionScreen.js     # Question display screen
│   ├── AnswerScreen.js       # Answer feedback screen
│   └── TreeScreen.js         # Tree visualization screen
│
├── components/               # Reusable UI components
│   └── TreeComponent.js      # Tree visualization component
│
├── data/                     # App data
│   └── questions.js          # All quiz questions organized by category
│
├── assets/                   # Images and graphics
│   ├── image/                # App images (logo, etc.)
│   └── vectors/              # Category icons
│
├── Figma_Files/              # Design reference (keep for UI/mockup reference)
│   ├── Climate Trivia/       # Screen mockups
│   └── MyTree/               # Tree screen states
│
└── scripts/                  # Utility scripts
    └── addQuestion.js        # Helper script for adding questions
```

**Note:** The `Figma Files/` folder contains design mockups for reference only (not used by the app at runtime). Please keep this folder when cleaning up the project.

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo CLI** (optional - can use npx instead)
- **Expo Go app** (for testing on physical devices)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd MyTree
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install all required packages including React Native, Expo, and navigation libraries.

## ▶️ How to Start the Program

### Option 1: Start with Expo (Recommended)

1. **Start the Expo development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **Choose how to run the app:**
   - Press `i` to open in iOS Simulator (requires Xcode on Mac)
   - Press `a` to open in Android Emulator (requires Android Studio)
   - Press `w` to open in web browser
   - Scan the QR code with Expo Go app on your phone (iOS/Android)

### Option 2: Platform-Specific Commands

You can also start directly for a specific platform:

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web
npm run web
```

### First Time Setup

If this is your first time running the app:
1. Make sure all dependencies are installed (`npm install`)
2. Start the Expo server (`npm start`)
3. Choose your preferred platform (iOS, Android, or Web)
4. The app should open automatically or show a QR code to scan

## 📝 Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Start and open in iOS Simulator
- `npm run android` - Start and open in Android Emulator
- `npm run web` - Start and open in web browser

## 🛠️ Technology Stack

- **React Native** - Mobile app framework
- **Expo** - Development platform and toolchain
- **React Navigation** - Navigation library for screen routing
- **Expo Linear Gradient** - Gradient UI components

## 📍 Current status & next steps (for EAS / next agent)

- **App state:** The app is working end-to-end: Home → Category → Question → Answer → Tree. All screens and navigation are in place; questions and tree growth (score 0–5) work as intended.
- **Recent fix:** On `TreeScreen`, the tree was overlapping the instruction text. This was fixed by using `justifyContent: 'flex-end'` and `paddingBottom: 20` on the tree wrapper so the tree sits at the bottom and no longer covers the instructions.
- **Next:** Setting up **EAS (Expo Application Services)** for building and deploying the app (e.g. iOS/Android builds, app store submission, or OTA updates). Use this README and the project structure above as context when working on EAS configuration and builds.

## 📚 Adding Questions

Questions are stored in `data/questions.js`. Each question includes:
- Question text
- Multiple choice options
- Correct answer index
- Difficulty level
- Explanation
- Source citation
- Category

You can use the `scripts/addQuestion.js` script to help add new questions, or edit `data/questions.js` directly.

## 🐛 Troubleshooting

**App won't start?**
- Make sure all dependencies are installed: `npm install`
- Clear cache: `npx expo start -c`
- Check that Node.js version is 14 or higher: `node --version`

**Can't see the app on your phone?**
- Make sure your phone and computer are on the same Wi-Fi network
- Try using the tunnel option: `npx expo start --tunnel`

**Phone shows an older version than the simulator?**
- Your phone is likely running a cached JavaScript bundle. Force a fresh load:
  1. On your phone, shake the device to open the Expo dev menu, then tap **Reload**.
  2. Or restart the dev server with cache cleared: run `npm run start:clean`, then scan the QR code again and open the app.
- Make sure the phone is connected to the same dev server (same QR code / same terminal where you ran `npm start`).

**Development build: "Unable to find a destination" or wrong simulator (Option A)**  
When `npx expo run:ios` fails with a destination error, run the app on a specific simulator:

1. List available simulators: `xcrun simctl list devices available`
2. Pick a device from the list (e.g. **iPhone 16 Plus**, **iPhone 16 Pro**). Don’t type the UUID or parentheses—just the name in quotes.
3. Run the app on that simulator (use the **exact** name from the list, in quotes):
   ```bash
   npx expo run:ios --device "iPhone 16 Plus"
   ```
   To use a different simulator (e.g. iPhone 16 Pro), boot it first, then run:
   ```bash
   xcrun simctl boot "iPhone 16 Pro"
   npx expo run:ios --device "iPhone 16 Pro"
   ```

**Dependencies issues?**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## 📄 License

This project is private.

---

**Happy learning! 🌳**
