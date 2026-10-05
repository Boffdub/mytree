import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import ScreenHeader from "../components/ScreenHeader";

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState({
    allOff: false,
    dailyReminder: true,
    streakAlerts: true,
    newContent: false,
  });

  const toggleAllOff = () => {
    setNotifications((prev) =>
      prev.allOff
        ? { ...prev, allOff: false }
        : {
            allOff: true,
            dailyReminder: false,
            streakAlerts: false,
            newContent: false,
          },
    );
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <LinearGradient
      colors={[colors.lightGreen, colors.white]}
      style={styles.container}
    >
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        <View style={[styles.row, { marginBottom: 20 }]}>
          <Text style={styles.bodyText}>Turn off all notifications</Text>
          <Switch value={notifications.allOff} onValueChange={toggleAllOff} />
        </View>
        <View style={styles.row}>
          <Text style={styles.bodyText}>Daily Reminder</Text>
          <Switch
            value={notifications.dailyReminder}
            onValueChange={() => toggleNotification("dailyReminder")}
            disabled={notifications.allOff}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.bodyText}>Streak Alerts</Text>
          <Switch
            value={notifications.streakAlerts}
            onValueChange={() => toggleNotification("streakAlerts")}
            disabled={notifications.allOff}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.bodyText}>New Content</Text>
          <Switch
            value={notifications.newContent}
            onValueChange={() => toggleNotification("newContent")}
            disabled={notifications.allOff}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bodyText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
});
