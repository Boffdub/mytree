import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function TreeComponent({ score = 0, animatedScore, showGround = true }) {
  const displayScore = animatedScore !== undefined && animatedScore !== null ? animatedScore : score;
  const clampedScore = Math.max(0, Math.min(displayScore, 5));

  const getLayerOpacity = (layerIndex) => {
    // layerIndex 1 = top (smallest), 5 = bottom (largest). Layers fill from bottom up.
    if (clampedScore === 0) return 0.12;
    const unfilled = 0.15;
    const fillStart = 5 - layerIndex; // layer 5 fills [0,1], layer 4 [1,2], etc.
    const fillEnd = 6 - layerIndex;
    if (clampedScore <= fillStart) return unfilled;
    if (clampedScore >= fillEnd) return 1;
    // Smooth interpolation so growth is visible during animation (no discrete pop at the end)
    const t = (clampedScore - fillStart) / (fillEnd - fillStart);
    return unfilled + (1 - unfilled) * t;
  };

  // Trunk grows as score increases (simple but feels good)
  const trunkHeight = 180;

  return (
    <View style={[styles.container, !showGround && styles.containerNoGround]}>
      <View style={styles.foliageContainer}>
        <View style={[styles.triangle1, { opacity: getLayerOpacity(1) }]} />
        <View style={[styles.triangle2, { opacity: getLayerOpacity(2) }]} />
        <View style={[styles.triangle3, { opacity: getLayerOpacity(3) }]} />
        <View style={[styles.triangle4, { opacity: getLayerOpacity(4) }]} />
        <View style={[styles.triangle5, { opacity: getLayerOpacity(5) }]} />
      </View>

      <View style={[styles.trunk, { height: trunkHeight, opacity: clampedScore === 0 ? 0.2 : Math.min(1, 0.2 + 0.8 * clampedScore) }]} />
      {showGround && <View style={styles.ground} />}
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
  containerNoGround: {
    paddingBottom: 0,
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
