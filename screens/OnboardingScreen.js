import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TreeComponent from '../components/TreeComponent';
import { useAuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

const ONBOARDING_SLIDES = [
  { score: 0, caption: 'Your tree starts at 0.' },
  { score: 1, caption: 'When you get a question right, your tree grows.' },
  {
    score: 3,
    caption:
      "Depending on the difficulty you choose, wrong answers might make your tree shrink. You'll pick your level after you log in.",
  },
  { score: 5, caption: 'You grow a full tree when you get 5 correct questions in a row.' },
  { score: 5, showLifelines: true },
];

const LIFELINES = [
  {
    label: '50/50',
    name: '50/50',
    description: '2 of the wrong choices will be removed',
  },
  {
    label: '[ ]',
    name: 'Infographics',
    description: "We'll show an infographic that could help you",
  },
  {
    label: '( )',
    name: 'Shield',
    description: 'Your tree will not shrink for at least 1 question',
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const { markOnboardingSeen } = useAuthContext();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const returnTo = route?.params?.returnTo || 'Welcome';
  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

  const goToIndex = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleSkipOrFinish = async () => {
    await markOnboardingSeen();
    if (returnTo === 'Settings') {
      navigation.goBack();
    } else {
      navigation.replace('Welcome');
    }
  };

  const renderSlide = useCallback(({ item }) => (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={[styles.slide, { width }]}
    >
      <View style={[styles.slideHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.slideTitle}>My Tree</Text>
        <Text style={styles.slideTagline}>
          Answer questions about the climate to grow your virtual tree!
        </Text>
      </View>

      <View style={styles.treeArea}>
        <TreeComponent score={item.score} showGround={false} />
      </View>

      {item.showLifelines ? (
        <View style={styles.lifelineContainer}>
          {LIFELINES.map((lifeline) => (
            <View key={lifeline.name} style={styles.lifelineRow}>
              <View style={styles.lifelineIcon}>
                <Text style={styles.lifelineIconText}>{lifeline.label}</Text>
              </View>
              <View style={styles.lifelineText}>
                <Text style={styles.lifelineName}>{lifeline.name}</Text>
                <Text style={styles.lifelineDesc}>{lifeline.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.caption}>{item.caption}</Text>
      )}
    </LinearGradient>
  ), [width, insets]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Skip button — slides 1–4 only */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={handleSkipOrFinish}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Prev arrow */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={styles.prevArrow}
          onPress={() => goToIndex(currentIndex - 1)}
        >
          <Text style={styles.arrowText}>◄</Text>
        </TouchableOpacity>
      )}

      {/* Next arrow — slides 1–4 only */}
      {!isLast && (
        <TouchableOpacity
          style={styles.nextArrow}
          onPress={() => goToIndex(currentIndex + 1)}
        >
          <Text style={styles.arrowText}>►</Text>
        </TouchableOpacity>
      )}

      {/* Bottom: dots or Get Started */}
      {isLast ? (
        <TouchableOpacity
          style={[styles.getStartedButton, { bottom: insets.bottom + 24 }]}
          onPress={handleSkipOrFinish}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.dotsRow, { bottom: insets.bottom + 24 }]}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 28,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  slideTagline: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },

  treeArea: {
    flex: 1,
    justifyContent: 'center',
  },

  caption: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
    lineHeight: 20,
    paddingHorizontal: 8,
    marginTop: 12,
  },

  lifelineContainer: {
    marginTop: 12,
    gap: 12,
  },
  lifelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lifelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifelineIconText: {
    fontSize: 10,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  lifelineText: { flex: 1 },
  lifelineName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.black,
  },
  lifelineDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },

  skipButton: {
    position: 'absolute',
    right: 20,
  },
  skipText: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: fonts.semiBold,
  },

  prevArrow: {
    position: 'absolute',
    left: 8,
    top: '45%',
    padding: 8,
  },
  nextArrow: {
    position: 'absolute',
    right: 8,
    top: '45%',
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    color: colors.primaryGreen,
  },

  dotsRow: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayLight,
  },
  dotActive: {
    backgroundColor: colors.primaryGreen,
  },

  getStartedButton: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 25,
  },
  getStartedText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
