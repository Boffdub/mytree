import React, { useEffect } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet } from 'react-native';
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
import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import QuestionScreen from './screens/QuestionScreen';
import AnswerScreen from './screens/AnswerScreen';
import TreeAnimationScreen from './screens/TreeAnimationScreen';
import TreeScreen from './screens/TreeScreen';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={[styles.appOuter, isWide && styles.appOuterWide]}>
          <View style={[styles.appInner, isWide && styles.appInnerWide]}>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{ cardStyle: { flex: 1 } }}
              >
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Category"
                  component={CategoryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Question"
                  component={QuestionScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TreeAnimation"
                  component={TreeAnimationScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Answer"
                  component={AnswerScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Tree"
                  component={TreeScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appOuter: {
    flex: 1,
  },
  appOuterWide: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',  // optional: color for the “sides” on web
  },
  appInner: {
    flex: 1,
    width: '100%',
  },
  appInnerWide: {
    maxWidth: 420,
  },
});