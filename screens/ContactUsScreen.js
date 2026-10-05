import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthContext } from "../context/AuthContext";
import { submitFeedback } from "../services/feedback";
import { getProfile } from "../services/profile";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";
import ScreenHeader from "../components/ScreenHeader";

const CATEGORIES = ["Bug", "Feedback", "Other"];

export default function ContactUsScreen({ navigation }) {
  const auth = useAuthContext();
  const [profile, setProfile] = useState({ firstName: null, lastName: null });
  const [category, setCategory] = useState("Bug");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile(auth.user.id).then(setProfile);
  }, []);

  const onSubmit = async () => {
    setSaving(true);
    try {
      await submitFeedback(auth.user.id, category, message);
      Alert.alert(
        "Thank you!",
        "Your feedback has been submitted. We will get back to you as soon as we can.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Could not submit feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.container}
    >
      <ScreenHeader title="Contact Us" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        <Text style={styles.label}>
          From: {profile.firstName} {profile.lastName}
        </Text>
        <Text style={styles.label}>Subject:</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, category === option && styles.chipSelected]}
              onPress={() => setCategory(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  category === option && styles.chipTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Message:</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe the bug or share your feedback..."
          placeholderTextColor={colors.gray}
          multiline
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
  },
  chipSelected: { backgroundColor: colors.primaryGreen },
  chipText: { color: colors.primaryGreen, fontFamily: fonts.semiBold },
  chipTextSelected: { color: colors.white },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 12,
    padding: 12,
    height: 140,
    textAlignVertical: "top",
    fontFamily: fonts.regular,
    backgroundColor: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
