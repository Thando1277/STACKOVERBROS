import React, { useState, useMemo, useEffect } from "react";
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
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext"; // ✅ ThemeContext

const { width, height } = Dimensions.get("window");

// Generic Select Component
function Select({ label, value, onSelect, options, themeColors }) {
  const [open, setOpen] = useState(false);
  const currentLabel = String(options.find((o) => o.value === value)?.label || label);

  return (
    <>
      <Pressable
        style={[styles.filterBtn, { backgroundColor: themeColors.filterBg, borderColor: themeColors.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.filterText, { color: themeColors.text }]}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={themeColors.text} style={{ marginLeft: 4 }} />
      </Pressable>

      {open && (
        <View style={styles.modalCover}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: themeColors.modalBg }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select {String(label)}</Text>
            
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[
                  styles.optionRow,
                  { backgroundColor: value === opt.value ? themeColors.primary + '20' : 'transparent' }
                ]}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
              >
                <Ionicons 
                  name={value === opt.value ? "checkmark-circle" : "ellipse-outline"} 
                  size={22} 
                  color={value === opt.value ? themeColors.primary : "#999"} 
                  style={{ marginRight: 12 }}
                />
                <Text style={[
                  styles.optionText, 
                  { color: value === opt.value ? themeColors.primary : themeColors.text }
                ]}>{String(opt.label)}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: themeColors.filterBg }]}
              onPress={() => {
                onSelect("");
                setOpen(false);
              }}
            >
              <Text style={[styles.clearText, { color: themeColors.text }]}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

// Status Select Component (Missing / Found / Delete)
function StatusSelect({ value, onChange, isOwner, themeColors }) {
  if (!isOwner) {
    return (
      <Text style={{ fontWeight: "bold", color: value === "search" ? "red" : "#7CC242" }}>
        {value === "search" ? "Missing" : value === "found" ? "Found" : value}
      </Text>
    );
  }

  const [open, setOpen] = useState(false);
  const options = [
    { label: "Missing", value: "search" },
    { label: "Found", value: "found" },
    { label: "Delete", value: "delete" },
  ];
  const currentLabel = options.find((o) => o.value === value)?.label || "Missing";

  return (
    <View style={{ marginTop: 4, width: 100 }}>
      <Pressable
        style={styles.statusButton}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ fontWeight: "bold", color: value === "search" ? "red" : "#7CC242" }}>
          {currentLabel} ▼
        </Text>
      </Pressable>

      {open && (
        <View style={styles.statusModalCover}>
          <Pressable style={styles.statusBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.statusModalSheet, { backgroundColor: themeColors.modalBg }]}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, { color: themeColors.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Filter Modal Component
function FilterModal({ visible, onClose, themeColors, gender, setGender, ageGroup, setAgeGroup }) {
  if (!visible) return null;

  const genderOptions = [
    { label: "All", value: "" },
    { label: "Male", value: "male" },
    { label: "Female", value: "female" }
  ];

  const ageOptions = [
    { label: "All", value: "" },
    { label: "0-12 (Child)", value: "child" },
    { label: "13-19 (Teen)", value: "teen" },
    { label: "20-40 (Adult)", value: "adult" },
    { label: "40+ (Senior)", value: "senior" }
  ];

  const clearAllFilters = () => {
    setGender("");
    setAgeGroup("");
  };

  return (
    <View style={styles.filterModalCover}>
      <Pressable style={styles.filterBackdrop} onPress={onClose} />
      <View style={[styles.filterModalSheet, { backgroundColor: themeColors.modalBg }]}>
        <Text style={[styles.filterModalTitle, { color: themeColors.text }]}>Filters</Text>
        
        {/* Gender Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>Gender</Text>
          <View style={styles.filterOptions}>
            {genderOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterOptionBtn,
                  { 
                    backgroundColor: gender === opt.value ? themeColors.primary : themeColors.filterBg,
                    borderColor: themeColors.border
                  }
                ]}
                onPress={() => setGender(opt.value)}
              >
                <Text style={[
                  styles.filterOptionText, 
                  { color: gender === opt.value ? "#fff" : themeColors.text }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age Group Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterSectionTitle, { color: themeColors.text }]}>Age Group</Text>
          <View style={styles.filterOptions}>
            {ageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterOptionBtn,
                  { 
                    backgroundColor: ageGroup === opt.value ? themeColors.primary : themeColors.filterBg,
                    borderColor: themeColors.border
                  }
                ]}
                onPress={() => setAgeGroup(opt.value)}
              >
                <Text style={[
                  styles.filterOptionText, 
                  { color: ageGroup === opt.value ? "#fff" : themeColors.text }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[styles.filterActionBtn, styles.clearAllBtn, { backgroundColor: themeColors.filterBg }]}
            onPress={clearAllFilters}
          >
            <Text style={[styles.filterActionText, { color: themeColors.text }]}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterActionBtn, styles.applyBtn, { backgroundColor: themeColors.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.filterActionText, { color: "#fff" }]}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------- HomeScreen Component ----------
export default function HomeScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme(); // ✅ ThemeContext
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("search");
  const [selectedCategory, setSelectedCategory] = useState("Person");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ---------- Theme Colors ----------
  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#E0E0E0" : "#222",
    border: isDark ? "#555" : "#ccc",
    filterBg: isDark ? "#333" : "#e0e0e0",
    modalBg: isDark ? "#2A2A2A" : "#fff",
    selectBg: isDark ? "#3A3A3A" : "#f9f9f9",
    primary: "#7CC242",
    cardBg: isDark ? "#2A2A2A" : "#fff",
  };

  // Firestore fetch
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const allReports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(allReports);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (report, newStatus) => {
    if (!report?.id) return;
    if (report.userId !== auth.currentUser?.uid) {
      alert("You can only change your own reports.");
      return;
    }

    const docRef = doc(db, "reports", report.id);
    try {
      if (newStatus === "delete") {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, { status: newStatus });
      }
    } catch (err) {
      console.error("Error updating report:", err);
    }
  };

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (!r) return false;
      if (selectedCategory !== r.type) return false;
      if (activeTab === "search" && r.status !== "search") return false;
      if (activeTab === "found" && r.status !== "found") return false;
      if (gender && r.gender !== gender) return false;

      // --------- FIXED AGE FILTER ----------
      if (ageGroup) {
        const age = Number(r.age);
        if (ageGroup === "child" && !(age >= 0 && age <= 12)) return false;
        if (ageGroup === "teen" && !(age >= 13 && age <= 19)) return false;
        if (ageGroup === "adult" && !(age >= 20 && age <= 40)) return false;
        if (ageGroup === "senior" && !(age > 40)) return false;
      }

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

  const imgFor = (r) => (r?.photo ? { uri: r.photo } : require("../assets/dude.webp"));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {Platform.OS === 'android' && <StatusBar backgroundColor={themeColors.bg} barStyle={isDark ? "light-content" : "dark-content"} />}
      
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../assets/log.png")} style={styles.logo} />
        <View style={styles.headerIcons}>
          <TextInput
            placeholder=" Search..."
            placeholderTextColor={isDark ? "#aaa" : "#888"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              borderWidth: 1,
              borderRadius: 10,
              borderColor: themeColors.border,
              width: 245,
              fontSize: 14,
              paddingVertical: 6,
              color: themeColors.text,
              backgroundColor: themeColors.selectBg,
            }}
          />
          <Ionicons name="search-outline" size={26} color={themeColors.text} style={{ marginRight: 8 }} />
          <Ionicons name="chatbubble-ellipses-outline" size={26} color={themeColors.primary} style={{ marginLeft: 10 }}
          onPress={() => navigation.navigate('InboxScreen')}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "search" ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab("search")}
        >
          <Text style={activeTab === "search" ? styles.activeTabText : styles.inactiveTabText}>Still In Search</Text>
          {activeTab === "search" && <View style={styles.activeLine} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "found" ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab("found")}
        >
          <Text style={activeTab === "found" ? styles.activeTabText : styles.inactiveTabText}>Found</Text>
          {activeTab === "found" && <View style={styles.activeLine} />}
        </TouchableOpacity>
      </View>

      {/* Categories - All borders are grey */}
      <View style={styles.categories}>
        <TouchableOpacity 
          onPress={() => setSelectedCategory("Person")} 
          style={[
            styles.category, 
            { 
              backgroundColor: selectedCategory === "Person" ? "#7C4DFF" : "transparent",
              borderColor: themeColors.border
            }
          ]}
        >
          <Ionicons 
            name="person-outline" 
            size={28} 
            color={selectedCategory === "Person" ? "white" : "#7C4DFF"} 
          />
          <Text style={[
            styles.catText, 
            { color: selectedCategory === "Person" ? "white" : "#7C4DFF" }
          ]}>
            Person
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setSelectedCategory("Pet")} 
          style={[
            styles.category, 
            { 
              backgroundColor: selectedCategory === "Pet" ? "#2196F3" : "transparent",
              borderColor: themeColors.border
            }
          ]}
        >
          <MaterialCommunityIcons 
            name="paw" 
            size={28} 
            color={selectedCategory === "Pet" ? "white" : "#2196F3"} 
          />
          <Text style={[
            styles.catText, 
            { color: selectedCategory === "Pet" ? "white" : "#2196F3" }
          ]}>
            Pet
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setSelectedCategory("Wanted")} 
          style={[
            styles.category, 
            { 
              backgroundColor: selectedCategory === "Wanted" ? "#E53935" : "transparent",
              borderColor: themeColors.border
            }
          ]}
        >
          <Ionicons 
            name="alert-circle-outline" 
            size={28} 
            color={selectedCategory === "Wanted" ? "white" : "#E53935"} 
          />
          <Text style={[
            styles.catText, 
            { color: selectedCategory === "Wanted" ? "white" : "#E53935" }
          ]}>
            Wanted
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory("Panic");
            navigation.navigate("Panic");
          }}
          style={[
            styles.category, 
            { 
              backgroundColor: selectedCategory === "Panic" ? "#FFB300" : "transparent",
              borderColor: themeColors.border
            }
          ]}
        >
          <Ionicons 
            name="warning-outline" 
            size={28} 
            color={selectedCategory === "Panic" ? "white" : "#FFB300"} 
          />
          <Text style={[
            styles.catText, 
            { color: selectedCategory === "Panic" ? "white" : "#FFB300" }
          ]}>
            Panic
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Button - Size reduced by 30% */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filtersButton, { backgroundColor: themeColors.primary }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={14} color="white" />
          <Text style={styles.filtersButtonText}>Filters</Text>
          {(gender || ageGroup) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{(gender ? 1 : 0) + (ageGroup ? 1 : 0)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Report List */}
      <ScrollView 
        style={styles.list}
        contentContainerStyle={Platform.OS === 'android' ? { paddingBottom: 90 } : {}}
      >
        {filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#666", marginTop: 16 }}>No reports found</Text>
        ) : (
          filtered.filter(r => r).map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
              <Image source={imgFor(r)} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.name, { color: themeColors.text }]}>{String(r.fullName)}</Text>
                  <StatusSelect value={r.status} onChange={(status) => handleStatusChange(r, status)} isOwner={r.userId === auth.currentUser?.uid} themeColors={themeColors} />
                </View>
                <Text style={[styles.details, { color: themeColors.text }]}>{String(r.age)} • {String(r.gender)}</Text>
                <Text style={[styles.details, { color: themeColors.text }]}>{String(r.lastSeenLocation)}</Text>

                <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate("Details", { report: r })}>
                  <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate("Comments", { reportId: r.id })}>
                  <Text style={styles.viewText}>Add/View Comments</Text>
                </TouchableOpacity>

                <Text style={[styles.time, { color: themeColors.text }]}>{new Date(r.createdAt?.seconds ? r.createdAt.toDate() : r.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal 
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        themeColors={themeColors}
        gender={gender}
        setGender={setGender}
        ageGroup={ageGroup}
        setAgeGroup={setAgeGroup}
      />

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: themeColors.bg }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={24} color={themeColors.primary} />
          <Text style={[styles.navText, { color: themeColors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Alerts")}>
          <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Alerts</Text>
        </TouchableOpacity>
        <View style={styles.navItem} />
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MapScreen")}>
          <Ionicons name="map-outline" size={24} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfilePage")}>
          <Ionicons name="person-outline" size={24} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Report Button - Outside bottom nav */}
      <TouchableOpacity 
        style={styles.reportBtn} 
        onPress={() => navigation.navigate("Report")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
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
  
  // Categories - All borders are grey
  categories: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginHorizontal: 20, 
    marginVertical: 12 
  },
  category: { 
    borderRadius: 12, 
    alignItems: "center", 
    width: width * 0.2, 
    paddingVertical: 8, 
    height: 90,
    borderWidth: 1,
  },
  catText: { 
    color: "white", 
    fontSize: 12, 
    marginTop: 17, 
    fontWeight: "800" 
  },
  
  // Filters Container - Size reduced by 30%
  filtersContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginHorizontal: 20, 
    marginVertical: 7 // Reduced from 9
  },
  filtersButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#7CC242", 
    paddingHorizontal: 12.6, // Reduced from 18
    paddingVertical: 7.56, // Reduced from 10.8
    borderRadius: 15.75, // Reduced from 22.5
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filtersButtonText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 10.08, // Reduced from 14.4
    marginLeft: 5.04 // Reduced from 7.2
  },
  filterBadge: {
    position: "absolute",
    top: -3.15, // Reduced from -4.5
    right: -3.15, // Reduced from -4.5
    backgroundColor: "red",
    borderRadius: 6.3, // Reduced from 9
    width: 12.6, // Reduced from 18
    height: 12.6, // Reduced from 18
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 7.56, // Reduced from 10.8
    fontWeight: "bold",
  },

  // Filter Modal Styles
  filterModalCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  filterBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterModalSheet: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  filterModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#222",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  filterActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  clearAllBtn: {
    backgroundColor: "#f0f0f0",
  },
  applyBtn: {
    backgroundColor: "#7CC242",
  },
  filterActionText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Existing styles
  filters: { flexDirection: "row", justifyContent: "space-evenly", marginHorizontal: 20, marginVertical: 10 },
  filterBtn: { flex: 1, borderWidth: 1, borderColor: "#ccc", marginHorizontal: 5, borderRadius: 8, backgroundColor: "#e0e0e0", alignItems: "center", paddingVertical: 8 },
  filterText: { color: "#444", fontWeight: "500" },
  
  modalCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  modalSheet: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#222",
  },
  
  clearBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  
  clearText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#555",
  },
  
  optionRow: { 
    flexDirection: "row", 
    justifyContent: "flex-start", 
    alignItems: "center", 
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  optionText: { 
    fontSize: 16, 
    color: "#333", 
    fontWeight: "500", 
  },
  list: { flex: 1, paddingHorizontal: 20, marginTop: 5, zIndex: 1 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, height: height * 0.25, borderWidth: 0.3, borderColor: "#02c048ff" },
  avatar: { width: 100, height: "100%", borderRadius: 12, marginRight: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },
  details: { fontSize: 14, color: "gray", marginTop: 3 },
  viewBtn: { backgroundColor: "#7CC242", borderRadius: 10, marginTop: 10, paddingVertical: 8, alignItems: "center", width: "80%" },
  viewText: { color: "white", fontWeight: "bold", fontSize: 14 },
  time: { fontSize: 12, color: "gray", marginTop: 8, marginLeft: 0 },
  
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: height * 0.015,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  navItem: { alignItems: "center" },
  navText: { fontSize: width * 0.03, color: "black" },

  // ---------- Report Button ----------
  reportBtn: {
    position: "absolute",
    bottom: height * 0.04,
    left: width / 2 - width * 0.075,
    backgroundColor: "#7CC242",
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },

  // ---------- StatusSelect Styles ----------
  statusButton: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#000", backgroundColor: "#f9f9f9", alignItems: "center" },
  statusModalCover: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  statusBackdrop: { flex: 1, backgroundColor: "transparent" },
  statusModalSheet: { position: "absolute", top: 35, width: 100, backgroundColor: "#fff", borderRadius: 6, borderWidth: 1, borderColor: "#000", paddingVertical: 4, zIndex: 201, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3 },
});