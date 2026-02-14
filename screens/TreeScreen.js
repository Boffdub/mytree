import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TreeComponent from '../components/TreeComponent';
import { useAppContext } from '../context/AppContext';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function TreeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { score } = useAppContext();


    return (
        <LinearGradient
            colors={[colors.lightGreen, colors.white]}
            style={styles.container}
        >
            {/* Header  - Just back button + title + spacer */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>My Tree</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={true}
            >
                {/* Tree Wrapper - tree sits above ground strip */}
                <View style={styles.treeWrapper}>
                    <TreeComponent score={score} showGround={false} />
                </View>

                {/* Ground strip: instruction + score (stacked) */}
                <View style={styles.ground}>
                <Text style={styles.instructionText}>
                    Every question you get right, your tree grows an inch. Every question you get wrong, it shrinks.
                </Text>
                <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>Score: {score}</Text>
                </View>
            </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: colors.lightGreenTransparent,
        fontFamily: fonts.bold,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 24,
        color: colors.black,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1E8F2D',
        marginBottom: 5,
        fontFamily: fonts.bold,
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        minHeight: 0,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    treeWrapper: {
        flex: 1,
        minHeight: 280,
        width: '100%',
        justifyContent: 'flex-end',
        paddingBottom: 0,
        alignItems: 'center',
    },
    ground: {
        width: '100%',
        backgroundColor: colors.treeTrunk,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 14,
        color: colors.white,
        textAlign: 'center',
        paddingHorizontal: 8,
        marginBottom: 16,
        fontFamily: fonts.regular,
        lineHeight: 20,
    },
    scoreBadge: {
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.primaryGreen,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    scoreBadgeText: {
        color: colors.primaryGreen,
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
});

