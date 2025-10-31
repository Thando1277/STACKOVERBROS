import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../Firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Alerts() {
  const { reports } = useData();
  const nav = useNavigation();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState("All");
  const [userInfo, setUserInfo] = useState(null);

  // Fetch logged-in user's data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserInfo(snap.data());
      } catch (e) {
        console.warn("Error fetching user info:", e);
      }
    };
    fetchUser();
  }, []);

  const colors = {
    background: isDark ? "#121212" : "#f8f8f8",
    card: isDark ? "#1e1e1e" : "#fff",
    text: isDark ? "#fff" : "#222",
    textSecondary: isDark ? "#aaa" : "#777",
    accent: "#7CC242",
  };

  // Filter + sort alerts
  const alerts = useMemo(() => {
    const filtered = reports.filter(
      (r) => r.type === "Panic" || r.type === "Wanted"
    );
    const sorted = filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    if (filter === "All") return sorted;
    return sorted.filter((r) => r.type === filter);
  }, [reports, filter]);

  const typeColor = (t) => {
    if (t === "Wanted") return "#3498db";
    if (t === "Panic") return "#e74c3c";
    return "#7f8c8d";
  };
  const typeIcon = (t) => {
    if (t === "Wanted") return "alert-circle-outline";
    if (t === "Panic") return "warning-outline";
    return "information-circle-outline";
  };

  const renderItem = ({ item }) => {
    const color = typeColor(item.type);
    const isWanted = item.type === "Wanted";

    // Anonymous logic
    const isAnonymous =
      item.type === "Panic" &&
      item.reporter &&
      item.reporter.toLowerCase() === "anonymous";

    const displayName = isAnonymous
      ? "Anonymous"
      : item.fullName || item.reporter || "User";

    const avatarUri = isAnonymous
      ? "https://cdn-icons-png.flaticon.com/512/456/456141.png"
      : item.photo || item.reporterAvatar || userInfo?.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        activeOpacity={0.85}
        onPress={() => nav.navigate("NotificationDetails", { report: item })}
      >
        <View style={[styles.leftStripe, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={{ marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={typeIcon(item.type)}
                    size={16}
                    color={color}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.reporter, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {item.location || "Unknown location"}
                </Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>

          {/* Details */}
          <View style={{ marginTop: 8 }}>
            {isWanted ? (
              <>
                <Text style={[styles.detail, { color: colors.text }]}>
                  Crime: {item.crimeWantedFor || "Unknown"}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  Armed With: {item.armedWith || "Unknown"}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  Reward: {item.rewardOffered || "None"}
                </Text>
              </>
            ) : (
              <Text
                numberOfLines={3}
                style={[styles.snippet, { color: colors.text }]}
              >
                {item.description || "No description provided."}
              </Text>
            )}
          </View>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>
                {isWanted ? "WANTED" : "PANIC"}
              </Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => nav.navigate("Comments", { reportId: item.id })}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#777"
              />
              <Text style={{ marginLeft: 6, color: "#777" }}>
                {(item.comments || []).length}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ label }) => (
    <TouchableOpacity
      style={[
        styles.filterBtn,
        {
          backgroundColor: filter === label ? colors.accent : "transparent",
          borderColor: colors.accent,
        },
      ]}
      onPress={() => setFilter(label)}
    >
      <Text
        style={{
          color: filter === label ? "#fff" : colors.text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Alerts Feed</Text>
        <View style={styles.filterRow}>
          <FilterButton label="All" />
          <FilterButton label="Panic" />
          <FilterButton label="Wanted" />
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textSecondary }}>No alerts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginTop: 25 },
  title: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  filterBtn: {
    borderWidth: 1.2,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: "hidden",
  },
  leftStripe: { width: 8 },
  cardBody: { flex: 1, padding: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: { width: 48, height: 48, borderRadius: 8 },
  reporter: { fontWeight: "800", fontSize: 15 },
  meta: { fontSize: 12, marginTop: 2 },
  timeText: { fontSize: 11 },
  snippet: { marginTop: 10 },
  detail: { fontSize: 13, marginTop: 2 },
  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
});
