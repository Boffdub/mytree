import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function ScoreBadge({ score, style }) {
  return (
    <View style={[styles.scoreBadge, style]}>
      <Text style={styles.scoreText}>Score: {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreBadge: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
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
});
