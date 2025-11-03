import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../Firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import BottomNavigation from "../components/BottomNavigation";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

export default function Alerts({ navigation }) {
  const { reports } = useData();
  const nav = useNavigation();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState("All");
  const [userInfo, setUserInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    searchBg: isDark ? "#2A2A2A" : "#f0f0f0",
  };

  // Filter + sort + search alerts
  const alerts = useMemo(() => {
    const filtered = reports.filter(
      (r) => r.type === "Panic" || r.type === "Wanted"
    );
    const sorted = filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    let result = filter === "All" ? sorted : sorted.filter((r) => r.type === filter);
    
    // Apply comprehensive search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => {
        const isAnonymous = r.type === "Panic" && r.reporter && r.reporter.toLowerCase() === "anonymous";
        const displayName = isAnonymous ? "Anonymous" : (r.fullName || r.reporter || "").toLowerCase();
        const location = (r.location || "").toLowerCase();
        const description = (r.description || "").toLowerCase();
        const crime = (r.crimeWantedFor || "").toLowerCase();
        const armedWith = (r.armedWith || "").toLowerCase();
        const reward = (r.rewardOffered || "").toLowerCase();
        const type = (r.type || "").toLowerCase();
        
        return displayName.includes(query) || 
               location.includes(query) || 
               description.includes(query) || 
               crime.includes(query) ||
               armedWith.includes(query) ||
               reward.includes(query) ||
               type.includes(query);
      });
    }
    
    return result;
  }, [reports, filter, searchQuery]);

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
            <View style={styles.userInfo}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.userDetails}>
                <View style={styles.nameRow}>
                  <Ionicons
                    name={typeIcon(item.type)}
                    size={isSmallDevice ? 14 : 16}
                    color={color}
                    style={styles.typeIcon}
                  />
                  <Text
                    style={[styles.reporter, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  {" "}{item.location || "Unknown location"}
                </Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {isWanted ? (
              <>
                <Text style={[styles.detail, { color: colors.text }]}>
                  <Text style={styles.detailLabel}>Crime: </Text>
                  {item.crimeWantedFor || "Unknown"}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  <Text style={styles.detailLabel}>Armed With: </Text>
                  {item.armedWith || "Unknown"}
                </Text>
                <Text style={[styles.detail, { color: colors.text }]}>
                  <Text style={styles.detailLabel}>Reward: </Text>
                  {item.rewardOffered || "None"}
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
              style={styles.commentsBtn}
              onPress={() => nav.navigate("Comments", { reportId: item.id })}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={isSmallDevice ? 16 : 18}
                color={colors.textSecondary}
              />
              <Text style={[styles.commentsText, { color: colors.textSecondary }]}>
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
          fontSize: isSmallDevice ? 12 : 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Alerts Feed</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.searchBg }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, location, crime..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter buttons */}
        <View style={styles.filterRow}>
          <FilterButton label="All" />
          <FilterButton label="Panic" />
          <FilterButton label="Wanted" />
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons 
            name={searchQuery ? "search" : "notifications-off-outline"} 
            size={64} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? "No alerts match your search" : "No alerts yet"}
          </Text>
          {searchQuery && (
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try searching by name, location, or crime type
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Use the BottomNavigation component */}
      <BottomNavigation navigation={navigation} currentRoute="Alerts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: { 
    fontSize: isSmallDevice ? 20 : 24, 
    fontWeight: "900",
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterRow: { 
    flexDirection: "row", 
    gap: 10,
  },
  filterBtn: {
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: isSmallDevice ? 14 : 18,
    borderRadius: 20,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 14,
    marginHorizontal: width * 0.04,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  leftStripe: { width: 6 },
  cardBody: { 
    flex: 1, 
    padding: isSmallDevice ? 12 : 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  avatar: { 
    width: isSmallDevice ? 44 : 52, 
    height: isSmallDevice ? 44 : 52, 
    borderRadius: 10,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 6,
  },
  reporter: { 
    fontWeight: "800", 
    fontSize: isSmallDevice ? 14 : 16,
    flex: 1,
  },
  meta: { 
    fontSize: isSmallDevice ? 11 : 12, 
    marginTop: 4,
  },
  timeText: { 
    fontSize: isSmallDevice ? 10 : 11,
    textAlign: 'right',
  },
  detailsContainer: {
    marginTop: 12,
  },
  snippet: { 
    fontSize: isSmallDevice ? 13 : 14,
    lineHeight: 20,
  },
  detail: { 
    fontSize: isSmallDevice ? 12 : 13, 
    marginTop: 4,
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: '700',
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20,
  },
  badgeText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: isSmallDevice ? 10 : 11,
    letterSpacing: 0.5,
  },
  commentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  commentsText: {
    marginLeft: 6,
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});