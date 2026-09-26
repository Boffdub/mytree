import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';
import ScreenHeader from '../components/ScreenHeader';


export default function AboutScreen({ navigation }) {
    return (
        <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
        <ScreenHeader title="About" onBack={() => navigation.goBack()} />

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.pageHeading}>About My Tree </Text>
            
            <Text style={styles.bodyText}>My Tree is a climate trivia game that helps you learn about climate change while growing your very own virtual tree. Your tree grows if you get a question right and vice versa, if you get one wrong.</Text>
            
            <Text style={styles.bodyText}>You can currently test your knowledge about categories related to climate. There is an easy, medium and hard difficulty level. So, whether you are just learning about climate or want to challenge yourself, there is a difficulty level for you.</Text>
            
            <Text style={styles.bodyText}>My Tree is currently in beta. Thanks for helping us test it. Contact us to report any bugs. </Text>

            <Text style={styles.bodyText}>Enjoy!</Text>
        </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    marginBottom: 10,
  },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  bodyText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
});
