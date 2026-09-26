import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import ScreenHeader from '../components/ScreenHeader';
import HowToPlayCarousel from '../components/HowToPlayCarousel';


export default function HowToPlayScreen({ navigation }) {
    return (
        <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
        <ScreenHeader title="How To Play" onBack={() => navigation.goBack()} />
        <View style={styles.body}>
            <HowToPlayCarousel />
        </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
