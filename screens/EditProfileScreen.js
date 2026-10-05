import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthContext } from "../context/AuthContext";
import { uploadAvatar, updateProfile } from "../services/profile";
import { colors } from "../constants/colors";
import { fonts } from "../styles/defaultStyles";

export default function EditProfileScreen({ navigation, route }) {
  const auth = useAuthContext();
  const [firstName, setFirstName] = useState(route.params?.firstName || "");
  const [lastName, setLastName] = useState(route.params?.lastName || "");
  const [avatarUri, setAvatarUri] = useState(route.params?.avatarUrl || null);
  const [pickedUri, setPickedUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const onUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to upload a profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setPickedUri(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      let avatarUrl;
      if (pickedUri) {
        avatarUrl = await uploadAvatar(auth.user.id, pickedUri);
      }
      await updateProfile(auth.user.id, { firstName, lastName, avatarUrl });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.avatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarPlaceholder}>👤</Text>
          )}
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>First Name:</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Firstname"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Last Name:</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Lastname"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  closeButton: { position: "absolute", top: 16, left: 16 },
  closeButtonText: { fontSize: 24, color: colors.black },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.black,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 100, height: 100 },
  avatarPlaceholder: { fontSize: 40 },
  uploadButton: {
    backgroundColor: colors.grayLight,
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  uploadButtonText: { color: colors.black, fontFamily: fonts.semiBold },
  field: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  label: { width: 90, fontFamily: fonts.semiBold, color: colors.black },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: fonts.regular,
  },
  saveButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
