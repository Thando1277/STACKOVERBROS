import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useData } from "../context/DataContext";

const { width, height } = Dimensions.get("window");

function Select({ label, value, onSelect, options }) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || label;
  return (
    <>
      <Pressable style={styles.filterBtn} onPress={() => setOpen(true)}>
        <Text style={styles.filterText}>{currentLabel} ▼</Text>
      </Pressable>

      {open && (
        <View style={styles.modalCover}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
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

export default function HomeScreen() {
  const navigation = useNavigation();
  const { reports } = useData();

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
          r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.lastSeenLocation.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
        return false;
      return true;
    });
  }, [reports, selectedCategory, activeTab, gender, ageGroup, searchQuery]);

  const imgFor = (r) =>
    r.photo ? { uri: r.photo } : require("../assets/dude.webp");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../assets/log.png")} style={styles.logo} />
        <View style={styles.headerIcons}>
        <TextInput
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={{
                      borderWidth: 1,
                      borderRadius: 15,
                      borderColor: "#ccc",
                      width: 150,
                      fontSize: 14,
                      paddingVertical: 2,
                    }}
                  />


          <Ionicons
            name="search-outline"
            size={26}
            color="black"
            style={{ marginRight: 8 }}
          />
         
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={26}
            color="#7CC242"
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "search" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("search")}
        >
          <Text
            style={
              activeTab === "search"
                ? styles.activeTabText
                : styles.inactiveTabText
            }
          >
            Still In Search
          </Text>
          {activeTab === "search" && <View style={styles.activeLine} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "found" ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab("found")}
        >
          <Text
            style={
              activeTab === "found"
                ? styles.activeTabText
                : styles.inactiveTabText
            }
          >
            Found
          </Text>
          {activeTab === "found" && <View style={styles.activeLine} />}
        </TouchableOpacity>
      </View>

      {/* Category Buttons Person,Pet, etc.*/}
      <View style={styles.categories}>
        <TouchableOpacity
          onPress={() => setSelectedCategory("Person")}
          style={[styles.category, { backgroundColor: "#7C4DFF" }]}
        >
          <Ionicons name="person-circle-outline" size={28} color="white" />
          <Text style={styles.catText}>Person</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedCategory("Pet")}
          style={[styles.category, { backgroundColor: "#2196F3" }]}
        >
          <MaterialCommunityIcons name="paw" size={28} color="white" />
          <Text style={styles.catText}>Pet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedCategory("Wanted")}
          style={[styles.category, { backgroundColor: "#E53935" }]}
        >
          <Ionicons name="alert-circle-outline" size={28} color="white" />
          <Text style={styles.catText}>Wanted</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedCategory("Panic")}
          style={[styles.category, { backgroundColor: "#FFB300" }]}
        >
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

      {/* List */}
      <ScrollView style={styles.list}>
        {filtered.length === 0 ? (
          <Text
            style={{ textAlign: "center", color: "#666", marginTop: 16 }}
          >
            No reports found
          </Text>
        ) : (
          filtered.map((r) => (
            <View key={r.id} style={styles.card}>
              <Image source={imgFor(r)} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{r.fullName}</Text>
                  <Text
                    style={[
                      styles.missing,
                      { color: r.status === "search" ? "red" : "#7CC242" },
                    ]}
                  >
                    {r.status === "search" ? "Missing" : "Found"}
                  </Text>
                </View>

                <Text style={styles.details}>
                  {r.age} • {r.gender}
                </Text>
                <Text style={styles.details}>{r.lastSeenLocation}</Text>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate("Details", { report: r })}
                >
                  <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>
                <Text style={styles.time}>
                  {new Date(r.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom navigation Home,Reports etc..*/}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#7CC242" />
          <Text style={[styles.navText, { color: "#7CC242" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => navigation.navigate("Report")}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map-outline" size={24} color="black" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onpress = {() => navigation.navigate("Profile")}>
          <Ionicons name="person-outline" size={24} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 10,
    alignItems: "center",
  },
  logo: { width: 50, height: 40, resizeMode: "contain" },
  headerIcons: { flexDirection: "row", alignItems: "center" },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 5,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, marginHorizontal: 5 },

  activeTab: { backgroundColor: "#7CC242" },
  inactiveTab: { backgroundColor: "#e0e0e0" },
  activeTabText: { color: "white", fontWeight: "bold", fontSize: 14 },
  inactiveTabText: { color: "black", fontWeight: "600", fontSize: 14 },
  activeLine: {
    marginTop: 5,
    height: 3,
    width: "60%",
    backgroundColor: "white",
    borderRadius: 2,
  },

  categories: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginVertical: 12,
  },
  category: {
    borderRadius: 12,
    alignItems: "center",
    width: width * 0.2,
    paddingVertical: 8,
    height: 90,
  },
  catText: { color: "white", fontSize: 12, marginTop: 17, fontWeight: "800" },

  filters: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  filterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    paddingVertical: 8,
  },
  filterText: { color: "#444", fontWeight: "500" },

  // modal overlay helpers used by Select
  modalCover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 ,},
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "white",
    borderRadius: 16,
   
   
    padding: 16,
    position: "absolute",
    left: 0,
    right: 0,
    top: 50,
    zIndex: 100,
   borderWidth: 2,
   borderColor: "#7CC242",
  
  },
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
    shadowRadius: 4,
    height: height * 0.25,
  },
  avatar: { width: 100, height: "100%", borderRadius: 12, marginRight: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },
  missing: { fontWeight: "bold", fontSize: 14 },
  details: { fontSize: 14, color: "gray", marginTop: 3 },
  viewBtn: {
    backgroundColor: "#7CC242",
    borderRadius: 6,
    marginTop: 30,
    paddingVertical: 8,
    alignItems: "center",
    width: "75%",
  },
  viewText: { color: "white", fontWeight: "bold", fontSize: 14 },
  time: { fontSize: 12, color: "gray", marginTop: 8, marginLeft:0, },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, color: "black" },
  reportBtn: {
    backgroundColor: "#7CC242",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25,
    elevation: 5,
  },
});
