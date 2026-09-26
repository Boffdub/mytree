import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { colors } from '../constants/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function WebViewScreen({ navigation, route }) {
    const { url, title } = route.params;

    return (
        <LinearGradient colors={[colors.lightGreen, colors.white]} style={styles.container}>
            <ScreenHeader title={title} onBack={() => navigation.goBack()} />
            <WebView source={{ uri: url }} style={styles.webview} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    webview: { flex: 1 },
});
