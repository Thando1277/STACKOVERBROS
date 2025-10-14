import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useData } from "../context/DataContext";
import { SafeAreaView } from "react-native-safe-area-context";
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get("window");

// Generic Select Component
function Select({ label, value, onSelect, options }) {
  const [open, setOpen] = useState(false);
  const currentLabel = String(options.find((o) => o.value === value)?.label || label);

  return (
    <>
      <Pressable style={styles.filterBtn} onPress={() => setOpen(true)}>
        <Text style={styles.filterText}>{currentLabel} ▼</Text>
      </Pressable>

      {open && (
        <View style={styles.modalCover}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{String(label)}</Text>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={styles.optionRow}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{String(opt.label)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                onSelect("");
                setOpen(false);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

// Status Select Component (Missing / Found / Delete)
function StatusSelect({ value, onChange, isOwner }) {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Missing", value: "search" },
    { label: "Found", value: "found" },
    { label: "Delete", value: "delete" },
  ];
  const currentLabel = String(options.find((o) => o.value === value)?.label || "Missing");

  // Prevent non-owners from changing status
  if (!isOwner) {
    return (
      <Text style={{ fontWeight: "bold", color: value === "search" ? "red" : "#7CC242" }}>
        {currentLabel}
      </Text>
    );
  }

  return (
    <>
      <Pressable
        style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "#ccc" }}
        onPress={() => setOpen(true)}
      >
        <Text style={{ fontWeight: "bold", color: value === "search" ? "red" : "#7CC242" }}>
          {currentLabel} ▼
        </Text>
      </Pressable>

      {open && (
        <View style={styles.statusModalCover}>
          <Pressable style={styles.statusBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.statusModalSheet}>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={styles.optionRow}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.optionText}>{String(opt.label)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { reports, updateReportStatus, deleteReport, currentUser } = useData();

  const [activeTab, setActiveTab] = useState("search");
  const [selectedCategory, setSelectedCategory] = useState("Person");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (selectedCategory !== r.type) return false;
      if (activeTab === "search" && r.status !== "search") return false;
      if (activeTab === "found" && r.status !== "found") return false;
      if (gender && r.gender !== gender) return false;
      if (ageGroup && r.ageGroup !== ageGroup) return false;
      if (
        searchQuery &&
        !(
          String(r.fullName).toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(r.lastSeenLocation).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
        return false;
      return true;
    });
  }, [reports, selectedCategory, activeTab, gender, ageGroup, searchQuery]);

  const imgFor = (r) => (r.photo ? { uri: r.photo } : require("../assets/dude.webp"));

  const handleStatusChange = (r, status) => {
    if (status === "delete") {
      deleteReport(r.id);
    } else {
      updateReportStatus(r.id, status);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../assets/log.png")} style={styles.logo} />
        <View style={styles.headerIcons}>
          <TextInput
            placeholder=" Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              borderWidth: 1,
              borderRadius: 10,
              borderColor: "#ccc",
              width: 245,
              fontSize: 14,
              paddingVertical: 6,
            }}
          />
          <Ionicons name="search-outline" size={26} color="black" style={{ marginRight: 8 }} />
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#7CC242" style={{ marginLeft: 10 }} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "search" ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab("search")}
        >
          <Text style={activeTab === "search" ? styles.activeTabText : styles.inactiveTabText}>
            Still In Search
          </Text>
          {activeTab === "search" && <View style={styles.activeLine} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "found" ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab("found")}
        >
          <Text style={activeTab === "found" ? styles.activeTabText : styles.inactiveTabText}>
            Found
          </Text>
          {activeTab === "found" && <View style={styles.activeLine} />}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        <TouchableOpacity onPress={() => setSelectedCategory("Person")} style={[styles.category, { backgroundColor: "#7C4DFF" }]}>
          <Ionicons name="person-circle-outline" size={28} color="white" />
          <Text style={styles.catText}>Person</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory("Pet")} style={[styles.category, { backgroundColor: "#2196F3" }]}>
          <MaterialCommunityIcons name="paw" size={28} color="white" />
          <Text style={styles.catText}>Pet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory("Wanted")} style={[styles.category, { backgroundColor: "#E53935" }]}>
          <Ionicons name="alert-circle-outline" size={28} color="white" />
          <Text style={styles.catText}>Wanted</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory("Panic")} style={[styles.category, { backgroundColor: "#FFB300" }]}>
          <Ionicons name="warning-outline" size={28} color="white" />
          <Text style={styles.catText}>Panic</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Select
          label="Gender"
          value={gender}
          onSelect={setGender}
          options={[
            { label: "All", value: "" },
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
        />
        <Select
          label="Age"
          value={ageGroup}
          onSelect={setAgeGroup}
          options={[
            { label: "All", value: "" },
            { label: "0-12 (Child)", value: "child" },
            { label: "13-19 (Teen)", value: "teen" },
            { label: "20-40 (Adult)", value: "adult" },
            { label: "40+ (Senior)", value: "senior" },
          ]}
        />
      </View>

      {/* Report List */}
      <ScrollView style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#666", marginTop: 16 }}>No reports found</Text>
        ) : (
          filtered.map((r) => (
            <View key={String(r.id)} style={styles.card}>
              <Image source={imgFor(r)} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{String(r.fullName)}</Text>
                  <StatusSelect
                    value={r.status}
                    onChange={(status) => handleStatusChange(r, status)}
                    isOwner={currentUser ? r.userId === currentUser.id : false} // <-- SAFETY FIX
                  />
                </View>
                <Text style={styles.details}>{String(r.age)} • {String(r.gender)}</Text>
                <Text style={styles.details}>{String(r.lastSeenLocation)}</Text>

                {/* View Details Button */}
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate("Details", { report: r })}
                >
                  <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>

                {/* Add/View Comments Button */}
                <TouchableOpacity
                  style={styles.viewBtn}  // same styling as View Details
                  onPress={() => navigation.navigate("Comments", { reportId: r.id })}
                >
                  <Text style={styles.viewText}>Add/View Comments</Text>
                </TouchableOpacity>

                <Text style={styles.time}>{new Date(r.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#7CC242" />
          <Text style={[styles.navText, { color: "#7CC242" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate("Report")}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map-outline" size={24} color="black" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfilePage")}>
          <Ionicons name="person-outline" size={24} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: 10, alignItems: "center" },
  logo: { width: 50, height: 40, resizeMode: "contain" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  tabs: { flexDirection: "row", marginHorizontal: 20, marginTop: 12, marginBottom: 5 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, marginHorizontal: 5 },
  activeTab: { backgroundColor: "#7CC242" },
  inactiveTab: { backgroundColor: "#e0e0e0" },
  activeTabText: { color: "white", fontWeight: "bold", fontSize: 14 },
  inactiveTabText: { color: "black", fontWeight: "600", fontSize: 14 },
  activeLine: { marginTop: 5, height: 3, width: "60%", backgroundColor: "white", borderRadius: 2 },
  categories: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginVertical: 12 },
  category: { borderRadius: 12, alignItems: "center", width: width * 0.2, paddingVertical: 8, height: 90 },
  catText: { color: "white", fontSize: 12, marginTop: 17, fontWeight: "800" },
  filters: { flexDirection: "row", justifyContent: "space-evenly", marginHorizontal: 20, marginVertical: 10 },
  filterBtn: { flex: 1, borderWidth: 1, borderColor: "#ccc", marginHorizontal: 5, borderRadius: 8, backgroundColor: "#e0e0e0", alignItems: "center", paddingVertical: 8 },
  filterText: { color: "#444", fontWeight: "500" },
  modalCover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: "white", borderRadius: 16, padding: 16, position: "absolute", left: 0, right: 0, top: 50, zIndex: 100, borderWidth: 2, borderColor: "#7CC242" },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomColor: "#eee", borderBottomWidth: 1 },
  optionText: { fontSize: 15, color: "#222" },
  clearBtn: { marginTop: 10, alignSelf: "flex-end", backgroundColor: "#e0e0e0", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  clearText: { color: "#444", fontWeight: "600" },
  list: { flex: 1, paddingHorizontal: 20, marginTop: 5 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 1,
    height: height * 0.25,
    borderWidth: 0.2,
    borderColor: "#02c048ff",
  },
  avatar: { width: 100, height: "100%", borderRadius: 12, marginRight: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },
  details: { fontSize: 14, color: "gray", marginTop: 3 },
  viewBtn: { backgroundColor: "#7CC242", borderRadius: 10, marginTop: 20, paddingVertical: 8, alignItems: "center", width: "80%" },
  viewText: { color: "white", fontWeight: "bold", fontSize: 14 },
  time: { fontSize: 12, color: "gray", marginTop: 8, marginLeft: 0 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, color: "black" },
  reportBtn: { backgroundColor: "#7CC242", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: -25, elevation: 5 },
  statusModalCover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  statusBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  statusModalSheet: { backgroundColor: "white", borderRadius: 12, padding: 12, position: "absolute", left: 50, right: 50, top: 100, zIndex: 100, borderWidth: 1, borderColor: "#ccc" },
});
