import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function Alerts() {
  const { reports } = useData();
  const nav = useNavigation();
  const { isDark } = useTheme();

  const colors = {
    background: isDark ? "#121212" : "#f8f8f8",
    card: isDark ? "#1e1e1e" : "#fff",
    text: isDark ? "#fff" : "#222",
    textSecondary: isDark ? "#aaa" : "#777",
  };

  const panicReports = useMemo(() => reports.filter(r => r.type === "Panic").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [reports]);

  const sevColor = (s) => {
    if (!s) return "#999";
    switch ((s || "").toLowerCase()) {
      case "low": return "#2ecc71";
      case "medium": return "#f39c12";
      case "high": return "#e74c3c";
      case "urgent": return "#8e44ad";
      default: return "#999";
    }
  };

  const renderItem = ({ item }) => {
    const color = sevColor(item.severity);
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => nav.navigate("NotificationDetails", { report: item })}>
        <View style={[styles.leftStripe, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={ item.photo ? { uri: item.photo } : require("../assets/dude.webp") } style={styles.avatar} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.reporter, { color: colors.text }]}>{item.reporter || item.fullName || "Unknown"}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.type} • {item.age ? item.age + "yrs" : "—"} • {item.gender || "—"}</Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <Text numberOfLines={2} style={[styles.snippet, { color: colors.text }]}>{item.description || "No description provided."}</Text>
          <View style={styles.bottomRow}>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{(item.severity || "Info").toUpperCase()}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#777" />
              <Text style={{ marginLeft: 6, color: "#777" }}>{(item.comments || []).length}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Emergency Alerts</Text>
      {panicReports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textSecondary }}>No alerts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={panicReports}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: "900", marginBottom: 12 , marginTop: 25},
  card: { flexDirection: "row", borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, overflow: "hidden" },
  leftStripe: { width: 8 },
  cardBody: { flex: 1, padding: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 8 },
  reporter: { fontWeight: "800", fontSize: 15 },
  meta: { fontSize: 12, marginTop: 2 },
  timeText: { fontSize: 11 },
  snippet: { marginTop: 10 },
  bottomRow: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 },
});
