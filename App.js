import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import WelcomeScreen from './screens/WelcomeScreen';
import EmailSignInScreen from './screens/EmailSignInScreen';
import MagicLinkSentScreen from './screens/MagicLinkSentScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import QuestionScreen from './screens/QuestionScreen';
import AnswerScreen from './screens/AnswerScreen';
import TreeAnimationScreen from './screens/TreeAnimationScreen';
import TreeScreen from './screens/TreeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { colors } from './constants/colors';

SplashScreen.preventAutoHideAsync();
const Stack = createStackNavigator();

function AppNavigator() {
  const { mode } = useAuthContext();

  if (mode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  const initialRoute = mode === 'welcome' ? 'Welcome' : 'Home';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ cardStyle: { flex: 1 }, headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="EmailSignIn" component={EmailSignInScreen} />
        <Stack.Screen name="MagicLinkSent" component={MagicLinkSentScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="TreeAnimation" component={TreeAnimationScreen} />
        <Stack.Screen name="Answer" component={AnswerScreen} />
        <Stack.Screen name="Tree" component={TreeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = isWeb && width > 400;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GameProvider>
          <View style={[styles.appOuter, isWide && styles.appOuterWide]}>
            <View style={[styles.appInner, isWide && styles.appInnerWide]}>
              <AppNavigator />
            </View>
          </View>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appOuter: { flex: 1 },
  appOuterWide: { alignItems: 'center', backgroundColor: '#f5f5f5' },
  appInner: { flex: 1, width: '100%' },
  appInnerWide: { maxWidth: 420 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
