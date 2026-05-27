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

export default function TreeComponent({ score = 0, animatedScore, animatedValue, showGround = true, size = 1 }) {
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

  const dim = {
    container: { paddingBottom: showGround ? 20 * size : 0 },
    foliage: { marginBottom: -20 * size },
    t1: { borderLeftWidth: 70 * size, borderRightWidth: 70 * size, borderBottomWidth: 80 * size, marginBottom: -20 * size },
    t2: { borderLeftWidth: 95 * size, borderRightWidth: 95 * size, borderBottomWidth: 95 * size, marginBottom: -25 * size },
    t3: { borderLeftWidth: 120 * size, borderRightWidth: 120 * size, borderBottomWidth: 110 * size, marginBottom: -30 * size },
    t4: { borderLeftWidth: 145 * size, borderRightWidth: 145 * size, borderBottomWidth: 125 * size, marginBottom: -35 * size },
    t5: { borderLeftWidth: 170 * size, borderRightWidth: 170 * size, borderBottomWidth: 140 * size },
    trunk: { width: 90 * size, height: 180 * size },
    ground: { height: 180 * size },
  };

  if (useAnimatedValue) {
    return (
      <View style={[styles.container, dim.container]}>
        <View style={[styles.foliageContainer, dim.foliage]}>
          <Animated.View style={[styles.triangle, dim.t1, { opacity: layerOpacityInterpolation(animatedValue, 1) }]} />
          <Animated.View style={[styles.triangle, dim.t2, { opacity: layerOpacityInterpolation(animatedValue, 2) }]} />
          <Animated.View style={[styles.triangle, dim.t3, { opacity: layerOpacityInterpolation(animatedValue, 3) }]} />
          <Animated.View style={[styles.triangle, dim.t4, { opacity: layerOpacityInterpolation(animatedValue, 4) }]} />
          <Animated.View style={[styles.triangle, dim.t5, { opacity: layerOpacityInterpolation(animatedValue, 5) }]} />
        </View>
        <Animated.View style={[styles.trunk, dim.trunk, { opacity: trunkOpacityInterpolation(animatedValue) }]} />
        {showGround && <View style={[styles.ground, dim.ground]} />}
      </View>
    );
  }

  return (
    <View style={[styles.container, dim.container]}>
      <View style={[styles.foliageContainer, dim.foliage]}>
        <View style={[styles.triangle, dim.t1, { opacity: getLayerOpacity(1) }]} />
        <View style={[styles.triangle, dim.t2, { opacity: getLayerOpacity(2) }]} />
        <View style={[styles.triangle, dim.t3, { opacity: getLayerOpacity(3) }]} />
        <View style={[styles.triangle, dim.t4, { opacity: getLayerOpacity(4) }]} />
        <View style={[styles.triangle, dim.t5, { opacity: getLayerOpacity(5) }]} />
      </View>
      <View style={[styles.trunk, dim.trunk, { opacity: clampedScore === 0 ? 0.2 : Math.min(1, 0.2 + 0.8 * clampedScore) }]} />
      {showGround && <View style={[styles.ground, dim.ground]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  foliageContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.treeTrunk,
  },
  trunk: {
    backgroundColor: colors.treeGround,
  },
  ground: {
    width: '110%',
    backgroundColor: colors.treeTrunk,
  },
});
