import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

const slides = [
    {
        type: 'simple',
        treeImage: require('../assets/vectors/Tree_1.png'),
        caption: 'Your tree starts at 0.',
    },
    {
        type: 'simple',
        treeImage: require('../assets/vectors/Tree_2.png'),
        caption: 'When you get a question right, your tree will grow.',
    },
    {
        type: 'simple',
        treeImage: require('../assets/vectors/Tree_1.png'),
        caption: 'Depending on the difficulty, wrong answers might make your tree shrink.',
    },
    {
        type: 'simple',
        treeImage: require('../assets/vectors/Tree_3.png'),
        caption: 'You grow a full tree when you get 5 correct questions in a row.',
    },
    {
        type: 'lifelines',
        footerNote:
            'You get 3 lifelines to help you but the available lifelines depend on the difficulty.',
        items: [
            {
                icon: require('../assets/vectors/5050.png'),
                title: '50/50',
                body: '2 of the wrong choices will be removed',
            },
            {
                icon: require('../assets/vectors/infographic.png'),
                title: 'Infographics',
                body: "We'll show an infographic that could help you",
            },
            {
                icon: require('../assets/vectors/shield.png'),
                title: 'Shield',
                body: 'Your tree will not shrink for at least 1 question',
            },
        ],
    },
];

export default function OnboardingScreen({ navigation }) {
    const [index, setIndex] = useState(0);
    const current = slides[index];
    const isLifelines = current.type === 'lifelines';

    return (
        <LinearGradient
            colors={[colors.lightGreen, colors.white]}
            style={styles.container}
        >
            <StatusBar style="auto" />

            {/* Tree Icon */}
            <View style={styles.treeContainer}>
                <View>
                    <Image 
                        source={require('../assets/image/My_Tree_Logo.png')}
                        style={styles.treeImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>My Tree</Text>

            {/* Description */}
            <Text style={styles.description}>
                Answer questions about the climate to grow your virtual tree!
            </Text>

            <View style={[styles.treeWrapper, isLifelines && styles.treeWrapperLifelines]}>
                {/* Left Arrow */}
                <TouchableOpacity
                    disabled={index === 0}
                    style={[styles.arrowHit, index === 0 && styles.arrowInactive]}
                    onPress={() => {
                        if (index > 0) setIndex(index - 1);
                    }}
                >
                    <Image
                        source={require('../assets/vectors/arrowLeft.png')}
                        style={styles.arrow}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Middle: tree (simple) or lifelines list */}
                <View style={styles.centerSlot}>
                    {isLifelines ? (
                        <ScrollView
                            style={styles.lifelinesScroll}
                            contentContainerStyle={styles.lifelinesScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {current.items.map((item, i) => (
                                <View key={`${item.title}-${i}`} style={styles.lifelineRow}>
                                    <Image
                                        source={item.icon}
                                        style={styles.lifelineIcon}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.lifelineTextCol}>
                                        <Text style={styles.lifelineTitle}>{item.title}</Text>
                                        <Text style={styles.lifelineBody}>{item.body}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <Image
                            source={current.treeImage}
                            style={styles.tree}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {/* Right Arrow */}
                <TouchableOpacity
                    disabled={index === slides.length - 1}
                    style={[
                        styles.arrowHit,
                        index === slides.length - 1 && styles.arrowInactive,
                    ]}
                    onPress={() => {
                        if (index < slides.length - 1) setIndex(index + 1);
                    }}
                >
                    <Image
                        source={require('../assets/vectors/arrowRight.png')}
                        style={styles.arrow}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>

            <Text style={[styles.body, styles.caption]}>
                {isLifelines ? current.footerNote : current.caption}
            </Text>

            {/*Buttons */}
            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={styles.primaryButtonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.primaryButtonText}>Log In</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    caption: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: fonts.regular,
      },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    treeContainer: {
        marginBottom: 20,
    },
    treeImage: {
        width: 125,
        height: 120,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 10,
        fontFamily: fonts.bold,
    },
    description: {
        fontSize: 16,
        color: colors.black,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
        fontFamily: fonts.regular,
        width: '75%',
    },
    treeWrapper: {
        maxHeight: 260,
        minHeight: 50,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    treeWrapperLifelines: {
        maxHeight: 340,
        minHeight: 220,
        alignItems: 'stretch',
    },
    centerSlot: {
        flex: 1,
        minWidth: 0,
        minHeight: 200,
        maxHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowHit: {
        width: 43,
        height: 43,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    lifelinesScroll: {
        width: '100%',
        maxHeight: 300,
    },
    lifelinesScrollContent: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    lifelineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    lifelineIcon: {
        width: 44,
        height: 44,
        marginRight: 15,
        marginLeft: 15,
    },
    lifelineTextCol: {
        flex: 1,
        minWidth: 0,
    },
    lifelineTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.black,
        fontFamily: fonts.bold,
    },
    lifelineBody: {
        fontSize: 12,
        width: 200,
        color: colors.black,
        fontFamily: fonts.regular,
    },
    tree: {
        width: 184,
        height: 293,
        paddingBottom: 20,
    },
    arrow: {
        width: 43,
        height: 43,
    },
    arrowInactive: {
        opacity: 0.1,
    },
    body: {
        paddingBottom: 20,
        paddingTop: 20,
    },
    primaryButton: {
        backgroundColor: '#1E8F2D',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
});
