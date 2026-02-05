import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fonts } from '../styles/defaultStyles';

export default function CategoryScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.screenContainer}>
            {/* Green Header */}
            <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Choose a Category</Text>
                    <View style={styles.placeholder} />
                </View>
            </View>
            
            {/* White Body */}
            <View style={styles.bodyContainer}>
                <Text style={styles.description}>Select a topic to start your climate quiz!</Text>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.categoryButton}
                        onPress={() => navigation.navigate('Question', { category: 'Energy' })}
                    >
                        <Image 
                            source={require('../assets/vectors/Energy.png')}
                            style={styles.categoryIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.categoryButtonText}>Energy</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.categoryButton}
                        onPress={() => navigation.navigate('Question', { category: 'Transportation' })}
                    >
                        <Image 
                            source={require('../assets/vectors/Transportation.png')}
                            style={styles.categoryIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.categoryButtonText}>Transportation</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.categoryButton}
                        onPress={() => navigation.navigate('Question', { category: 'Food & Agriculture' })}
                    >
                        <Image 
                            source={require('../assets/vectors/Food&Agriculture.png')}
                            style={styles.categoryIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.categoryButtonText}>Food & Agriculture</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.categoryButton}
                        onPress={() => navigation.navigate('Question', { category: 'Carbon Removal' })}
                    >
                        <Image 
                            source={require('../assets/vectors/Carbon_Removal.png')}
                            style={styles.categoryIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.categoryButtonText}>Carbon Removal</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Main container
    screenContainer: {
        flex: 1,
    },
    
    // Green header area
    headerContainer: {
        backgroundColor: colors.lightGreen,
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    
    // Header row
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    
    // Back button
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E8F2D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: colors.white,
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E8F2D',
        fontFamily: fonts.bold,
    },
    placeholder: {
        width: 40,
    },
    
    // White body area
    bodyContainer: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    
    description: {
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
        fontFamily: fonts.regular,
    },
    
    buttonContainer: {
        width: '100%',
    },
    
    categoryButton: {
        backgroundColor: colors.primaryGreen,
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    
    categoryIcon: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    
    categoryButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: fonts.bold,
    },
});
