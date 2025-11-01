// components/OfflineReportsBadge.jsx
// Add this component to your HomeScreen or ProfilePage for quick access

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { OfflineReportManager } from "../utils/OfflineReportManager";
import NetInfo from "@react-native-community/netinfo";

export default function OfflineReportsBadge() {
  const navigation = useNavigation();
  const [pendingCount, setPendingCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Initial load
    checkPendingReports();

    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
      checkPendingReports();
    });

    // Refresh every time component mounts
    const interval = setInterval(checkPendingReports, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const checkPendingReports = async () => {
    const count = await OfflineReportManager.getPendingCount();
    setPendingCount(count);
  };

  // Don't show if no pending reports
  if (pendingCount === 0) return null;

  return (
    <TouchableOpacity
      style={styles.badge}
      onPress={() => navigation.navigate("OfflineReports")}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline" size={24} color="#fff" />
        {pendingCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {pendingCount > 9 ? "9+" : pendingCount}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>Pending Reports</Text>
        <Text style={styles.subtitle}>
          {pendingCount} report{pendingCount > 1 ? "s" : ""} waiting to sync
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconContainer: {
    position: "relative",
    marginRight: 12,
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ff9800",
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  subtitle: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.9,
  },
});