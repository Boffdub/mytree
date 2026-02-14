import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/colors';

const UNFILLED = 0.15;
const ZERO_OPACITY = 0.12;

// One interpolation per layer (layer 1 = top, 5 = bottom). Fills from bottom up; matches getLayerOpacity.
function layerOpacityInterpolation(animValue, layerIndex) {
  const fillStart = 5 - layerIndex;
  const fillEnd = 6 - layerIndex;
  const start = fillStart <= 0 ? 0.001 : fillStart;
  return animValue.interpolate({
    inputRange: [0, start, fillEnd, 6],
    outputRange: [ZERO_OPACITY, UNFILLED, 1, 1],
  });
}

function trunkOpacityInterpolation(animValue) {
  return animValue.interpolate({
    inputRange: [0, 0.001, 6],
    outputRange: [0.2, 0.2, 1],
  });
}

export default function TreeComponent({ score = 0, animatedScore, animatedValue, showGround = true }) {
  const useAnimatedValue = animatedValue != null;
  const displayScore = animatedScore !== undefined && animatedScore !== null ? animatedScore : score;
  const clampedScore = Math.max(0, Math.min(displayScore, 5));

  const getLayerOpacity = (layerIndex) => {
    if (clampedScore === 0) return ZERO_OPACITY;
    const fillStart = 5 - layerIndex;
    const fillEnd = 6 - layerIndex;
    if (clampedScore <= fillStart) return UNFILLED;
    if (clampedScore >= fillEnd) return 1;
    const t = (clampedScore - fillStart) / (fillEnd - fillStart);
    return UNFILLED + (1 - UNFILLED) * t;
  };

  const trunkHeight = 180;

  if (useAnimatedValue) {
    return (
      <View style={[styles.container, !showGround && styles.containerNoGround]}>
        <View style={styles.foliageContainer}>
          <Animated.View style={[styles.triangle1, { opacity: layerOpacityInterpolation(animatedValue, 1) }]} />
          <Animated.View style={[styles.triangle2, { opacity: layerOpacityInterpolation(animatedValue, 2) }]} />
          <Animated.View style={[styles.triangle3, { opacity: layerOpacityInterpolation(animatedValue, 3) }]} />
          <Animated.View style={[styles.triangle4, { opacity: layerOpacityInterpolation(animatedValue, 4) }]} />
          <Animated.View style={[styles.triangle5, { opacity: layerOpacityInterpolation(animatedValue, 5) }]} />
        </View>
        <Animated.View style={[styles.trunk, { height: trunkHeight, opacity: trunkOpacityInterpolation(animatedValue) }]} />
        {showGround && <View style={styles.ground} />}
      </View>
    );
  }

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
    // marginBottom: -20,
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
    // marginBottom: -20,
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
    // marginBottom: -25,
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
    // marginBottom: -30,
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
    // marginBottom: -35,
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
