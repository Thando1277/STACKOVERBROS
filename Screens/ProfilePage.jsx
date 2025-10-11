import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useData } from "../context/DataContext";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, reports } = useData();

  // fallback user when DataContext doesn't provide one
  const currentUser =
    user ||
    ({
      fullName: "Guest User",
      email: "guest@example.com",
      phone: "",
      avatar: null,
      bio: "",
    });

  const avatarSource = currentUser.avatar
    ? { uri: currentUser.avatar } : require("../assets/dude.webp");

  const myReports = reports ? reports.filter((r) => r.reportedBy === currentUser.id) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}> 
            <Ionicons name="settings-outline" size={26} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{currentUser.fullName}</Text>
            {currentUser.bio ? (
              <Text style={styles.bio}>{currentUser.bio}</Text>
            ) : (
              <Text style={styles.email}>{currentUser.email}</Text>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text style={styles.editTxt}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => navigation.navigate("LogIn")}
              >
                <Text style={styles.logoutTxt}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{myReports.length}</Text>
            <Text style={styles.statLabel}>My Reports</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{reports ? reports.length : 0}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Bookmarks</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {myReports.length === 0 ? (
            <Text style={styles.emptyText}>You haven't reported anything yet.</Text>
          ) : (
            myReports.slice(0, 5).map((r) => (
              <View key={r.id} style={styles.activityRow}>
                <View style={styles.activityLeft}>
                  <Image source={r.photo ? { uri: r.photo } : require("../assets/dude.webp")} style={styles.actImg} />
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityTitle}>{r.fullName}</Text>
                  <Text style={styles.activitySubtitle}>{r.lastSeenLocation}</Text>
                  <Text style={styles.activityTime}>{new Date(r.createdAt).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 18, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#222" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 14,
  },
  avatar: { width: 96, height: 96, borderRadius: 12 },
  name: { fontSize: 18, fontWeight: "800", color: "#222" },
  bio: { color: "#666", marginTop: 6 },
  email: { color: "#666", marginTop: 6 },

  actionRow: { flexDirection: "row", marginTop: 12 },
  editBtn: { backgroundColor: "#7CC242", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginRight: 8 },
  editTxt: { color: "white", fontWeight: "700" },
  logoutBtn: { borderWidth: 1, borderColor: "#ddd", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  logoutTxt: { color: "#333", fontWeight: "700" },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  statBox: { flex: 1, backgroundColor: "#f7f7f7", marginHorizontal: 4, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "800", color: "#222" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },

  section: { marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyText: { color: "#666" },

  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  activityLeft: { marginRight: 12 },
  actImg: { width: 64, height: 64, borderRadius: 8 },
  activityRight: { flex: 1 },
  activityTitle: { fontWeight: "700", fontSize: 15 },
  activitySubtitle: { color: "#666", marginTop: 4 },
  activityTime: { color: "#999", marginTop: 6, fontSize: 12 },
});
