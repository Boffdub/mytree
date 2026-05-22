import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Image,
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
    label: '5050',
    name: '50/50',
    description: '2 of the wrong choices will be removed',
  },
  {
    label: '📊',
    name: 'Infographics',
    description: "We'll show an infographic that could help you",
  },
  {
    label: '🛡',
    name: 'Shield',
    description: 'Your tree will not shrink for at least 1 question',
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const { markOnboardingSeen, mode } = useAuthContext();
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

  const handleAuthExit = async () => {
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
        <Image
          source={require('../assets/image/My_Tree_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.slideTitle}>My Tree</Text>
        <Text style={styles.slideTagline}>
          Answer questions about the climate to grow your virtual tree!
        </Text>
      </View>

      <View style={styles.treeArea}>
        <View style={styles.treeScaleWrapper}>
          <TreeComponent score={item.score} showGround={false} />
        </View>
      </View>

      {item.showLifelines ? (
        <View style={styles.lifelineContainer}>
          {LIFELINES.map((lifeline) => (
            <View key={lifeline.name} style={styles.lifelineRow}>
              <View style={styles.lifelineIcon}>
                {lifeline.label === '5050' ? (
                  <View style={styles.lifelineFiftyFifty}>
                    <Text style={styles.lifelineFiftyText}>50</Text>
                    <View style={styles.lifelineFiftyDivider} />
                    <Text style={styles.lifelineFiftyText}>50</Text>
                  </View>
                ) : (
                  <Text style={styles.lifelineEmojiText}>{lifeline.label}</Text>
                )}
              </View>
              <View style={styles.lifelineText}>
                <Text style={styles.lifelineName}>{lifeline.name}</Text>
                <Text style={styles.lifelineDesc}>{lifeline.description}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.caption}>
            You get 3 lifelines to help you but the available lifelines depend on the difficulty you choose.
          </Text>
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

      {/* Register / Log In buttons — every slide */}
      <View style={[styles.authButtonContainer, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.registerButton} onPress={handleAuthExit}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={handleAuthExit}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 8,
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
    alignItems: 'center',
    overflow: 'hidden',
  },
  treeScaleWrapper: {
    transform: [{ scale: 0.55 }],
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifelineFiftyFifty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifelineFiftyText: {
    fontSize: 9,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    lineHeight: 11,
  },
  lifelineFiftyDivider: {
    width: 20,
    height: 1,
    backgroundColor: colors.primaryGreen,
    marginVertical: 1,
  },
  lifelineEmojiText: {
    fontSize: 20,
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

  prevArrow: {
    position: 'absolute',
    left: 8,
    top: '40%',
    padding: 8,
  },
  nextArrow: {
    position: 'absolute',
    right: 8,
    top: '40%',
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    color: colors.primaryGreen,
  },

  authButtonContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  registerButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  loginButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
