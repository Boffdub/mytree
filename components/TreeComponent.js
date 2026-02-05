import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function TreeComponent({ score = 0 }) {
  // Option B: 5 distinct foliage layers unlocked by score (0-5)
  const clampedScore = Math.max(0, Math.min(score, 5));

  const getLayerOpacity = (layerIndex) => {
    // layerIndex 1 = top (smallest), 5 = bottom (largest)
    if (clampedScore === 0) return 0.12;
    // Fill from BOTTOM: bottom clampedScore layers = full green (1), rest faint (0.15)
    const isFilled = layerIndex >= (6 - clampedScore);
    return isFilled ? 1 : 0.15;
  };

  // Trunk grows as score increases (simple but feels good)
  const trunkHeight = 150;

  return (
    <View style={styles.container}>
      <View style={styles.foliageContainer}>
        <View style={[styles.triangle1, { opacity: getLayerOpacity(1) }]} />
        <View style={[styles.triangle2, { opacity: getLayerOpacity(2) }]} />
        <View style={[styles.triangle3, { opacity: getLayerOpacity(3) }]} />
        <View style={[styles.triangle4, { opacity: getLayerOpacity(4) }]} />
        <View style={[styles.triangle5, { opacity: getLayerOpacity(5) }]} />
      </View>

      <View style={[styles.trunk, { height: trunkHeight, opacity: clampedScore === 0 ? 0.2 : 1 }]} />
      <View style={styles.ground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  foliageContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -20,
  },

  // Triangles (top to bottom)
  triangle1: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
    marginBottom: -20,
  },
  triangle2: {
    width: 0,
    height: 0,
    borderLeftWidth: 95,
    borderRightWidth: 95,
    borderBottomWidth: 95,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
    marginBottom: -25,
  },
  triangle3: {
    width: 0,
    height: 0,
    borderLeftWidth: 120,
    borderRightWidth: 120,
    borderBottomWidth: 110,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
    marginBottom: -30,
  },
  triangle4: {
    width: 0,
    height: 0,
    borderLeftWidth: 145,
    borderRightWidth: 145,
    borderBottomWidth: 125,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
    marginBottom: -35,
  },
  triangle5: {
    width: 0,
    height: 0,
    borderLeftWidth: 170,
    borderRightWidth: 170,
    borderBottomWidth: 140,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
  },

  trunk: {
    width: 90,
    backgroundColor: colors.treeGround,
  },
  ground: {
    width: '110%',
    height: 180,
    backgroundColor: colors.treeTrunk,
  },
});
