import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";
import { useAuthContext } from "../context/AuthContext";
import { getProfile, updateDifficulty } from "../services/profile";

const DIFFICULTIES = [
  {
    key: "Easy",
    label: "EASY",
    description: "Tree does not shrink\nLifelines: 50/50, Visual Reveal",
  },
  {
    key: "Medium",
    label: "MEDIUM",
    description:
      "Tree shrinks on wrong guesses\nLifelines: 50/50, Visual Reveal, Shield (3x)",
  },
  {
    key: "Hard",
    label: "HARD",
    description:
      "Tree shrinks on wrong guesses\nLifelines: 50/50, Visual Reveal, Shield (1x)",
  },
];

export default function DifficultyScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);
  const auth = useAuthContext();
  const fromProfile = route.params?.fromProfile ?? false;

  useEffect(() => {
    if (!auth.user?.id) return;
    getProfile(auth.user.id)
      .then((p) => {
        if (p.difficulty) setSelected(p.difficulty);
      })
      .catch(() => {});
  }, [auth.user?.id]);

  const handleSubmit = async () => {
    try {
      await updateDifficulty(auth.user.id, selected);
    } catch (err) {
      console.warn("[Difficulty] could not save choice:", err);
    }
    if (fromProfile) navigation.goBack();
    else navigation.navigate("Question", { difficulty: selected });
  };

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Image
            source={require("../assets/vectors/Profile.png")}
            style={styles.profileIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../assets/image/My_Tree_Logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>My Tree</Text>
      <Text style={styles.question}>
        {
          "Since we're all at a different level of the climate journey:\n\nWhat is your difficulty level?"
        }
      </Text>

      {DIFFICULTIES.map((d) => (
        <TouchableOpacity
          key={d.key}
          style={[styles.option, selected === d.key && styles.optionSelected]}
          onPress={() => setSelected(d.key)}
        >
          <Text style={styles.optionLabel}>{d.label}</Text>
          <Text style={styles.optionDescription}>{d.description}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.submit, !selected && styles.submitDisabled]}
        disabled={!selected}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>{fromProfile ? "Set" : "Submit"}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: colors.white, fontSize: 20, fontWeight: "bold" },

  profileIcon: { width: 28, height: 28 },
  logo: { width: 90, height: 90, marginTop: 10 },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.black,
    marginBottom: 12,
  },
  question: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.black,
    textAlign: "center",
    marginBottom: 20,
  },
  option: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "transparent",
  },
  optionSelected: { borderColor: colors.selectedYellow },
  optionLabel: { color: colors.white, fontSize: 18, fontFamily: fonts.bold },
  optionDescription: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: 4,
  },
  submit: {
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: colors.white,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
