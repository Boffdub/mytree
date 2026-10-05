import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";

export default function RegisterScreen({ navigation }) {
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
            source={require("../assets/image/My_Tree_Logo.png")}
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

      {/*Buttons */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.primaryButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.primaryButtonText}>Log In</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 10,
    fontFamily: fonts.bold,
  },
  description: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
    fontFamily: fonts.regular,
    width: "75%",
  },
  primaryButton: {
    backgroundColor: "#1E8F2D",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: fonts.bold,
  },
});
