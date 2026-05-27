import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
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
  {
    score: 5,
    showLifelines: true,
    caption: 'You get 3 lifelines to help you but the available lifelines depend on the difficulty you choose.',
  },
];

const LIFELINES = [
  { label: '5050', name: '50/50', description: '2 of the wrong choices will be removed' },
  { label: '📊', name: 'Infographics', description: "We'll show an infographic that could help you" },
  { label: '🛡', name: 'Shield', description: 'Your tree will not shrink for at least 1 question' },
];

// Section proportions — sum to 100. Tune these to redistribute vertical space.
const HEADER_FLEX = 22;
const IMAGE_FLEX = 50;
const CAPTION_FLEX = 10;
const BUTTON_FLEX = 18;

// Tree visible height as fraction of available content height.
// TreeComponent's natural height at size=1 is ~600px; we compute the size
// multiplier to make the visible tree this fraction of available height.
const TREE_NATURAL_HEIGHT = 600;
const TREE_HEIGHT_FRACTION = 0.32;
// Logo as fraction of available content height
const LOGO_FRACTION = 0.095;

export default function OnboardingScreen({ navigation, route }) {
  const { markOnboardingSeen } = useAuthContext();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const returnTo = route?.params?.returnTo || 'Welcome';

  // Measure the actual container size so we respect any parent maxWidth
  // (App.js applies maxWidth: 420 on wide screens). useWindowDimensions
  // would give the viewport size, which overflows the constrained container.
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const onContainerLayout = (e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== layout.width || h !== layout.height) {
      setLayout({ width: w, height: h });
    }
  };

  const { width, height } = layout;
  const padTop = insets.top + 16;
  const padBottom = insets.bottom + 16;
  const availableHeight = height - padTop - padBottom;

  const treeSize = (availableHeight * TREE_HEIGHT_FRACTION) / TREE_NATURAL_HEIGHT;
  const logoSize = Math.round(availableHeight * LOGO_FRACTION);

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

  const renderImageContent = (item) => {
    if (item.showLifelines) {
      return (
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
        </View>
      );
    }
    return <TreeComponent score={item.score} showGround={false} size={treeSize} />;
  };

  const renderSlide = useCallback(({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === ONBOARDING_SLIDES.length - 1;

    return (
      <LinearGradient
        colors={[colors.lightGreen, colors.white]}
        style={[styles.slide, { width, height, paddingTop: padTop, paddingBottom: padBottom }]}
      >
        {/* Section 1: Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/image/My_Tree_Logo.png')}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
          <Text style={styles.title}>My Tree</Text>
          <Text style={styles.tagline}>
            Answer questions about the climate to grow your virtual tree!
          </Text>
        </View>

        {/* Section 2: Image area with arrows */}
        <View style={styles.imageSection}>
          <View style={styles.arrowSlot}>
            {!isFirst && (
              <TouchableOpacity onPress={() => goToIndex(index - 1)} style={styles.arrowHit}>
                <Text style={styles.arrowText}>◄</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.imageCenter}>{renderImageContent(item)}</View>
          <View style={styles.arrowSlot}>
            {!isLast && (
              <TouchableOpacity onPress={() => goToIndex(index + 1)} style={styles.arrowHit}>
                <Text style={styles.arrowText}>►</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 3: Caption */}
        <View style={styles.captionSection}>
          <Text style={styles.caption}>{item.caption}</Text>
        </View>

        {/* Section 4: Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.registerButton} onPress={handleAuthExit}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={handleAuthExit}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }, [width, height, insets, treeSize, logoSize, padTop, padBottom]);

  return (
    <View style={styles.flatList} onLayout={onContainerLayout}>
      {width > 0 && height > 0 && (
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Section 1: Header
  header: {
    flex: HEADER_FLEX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: colors.primaryGreen,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },

  // Section 2: Image area
  imageSection: {
    flex: IMAGE_FLEX,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowSlot: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHit: {
    padding: 8,
  },
  arrowText: {
    fontSize: 40,
    color: colors.primaryGreen,
  },
  imageCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifelineContainer: {
    width: '100%',
    gap: 14,
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

  // Section 3: Caption
  captionSection: {
    flex: CAPTION_FLEX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Section 4: Buttons
  buttonSection: {
    flex: BUTTON_FLEX,
    justifyContent: 'flex-end',
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
