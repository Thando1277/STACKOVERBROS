import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../Firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import axios from "axios";
import * as mime from "react-native-mime-types";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const [currentUser, setCurrentUser] = useState({
    fullName: "",
    email: "",
    avatar: null,
    bio: "",
    id: "",
  });
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [totalReports, setTotalReports] = useState(0);
  const [activeTab, setActiveTab] = useState("myReports"); // 'myReports' or 'saved'
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);


  const totalFound = allReports.filter((r) => r.status === "found").length;

  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    card: isDark ? "#2A2A2A" : "#F5F5F5",
    text: isDark ? "#E0E0E0" : "#000",
    sub: isDark ? "#aaa" : "#555",
    border: isDark ? "#333" : "#ccc",
    popupBg: isDark ? "#2B2B2B" : "#fff",
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUser({
            fullName: data.fullname || data.fullName || data.name || "No Name",
            email: data.email || auth.currentUser?.email || "No Email",
            avatar: data.avatar || null,
            bio: data.bio || "",
            id: userId,
          });
          
          // Get saved report IDs
          const savedReportIds = data.savedReports || [];
          
          // Fetch all reports
          const allReportsSnapshot = await getDocs(collection(db, "reports"));
          const fetchedReports = allReportsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const userReports = fetchedReports.filter((r) => r.userId === userId);
          const userSavedReports = fetchedReports.filter((r) => savedReportIds.includes(r.id));

          setReports(userReports);
          setSavedReports(userSavedReports);
          setAllReports(fetchedReports);
          setTotalReports(fetchedReports.length);
        } else {
          setCurrentUser({
            fullName: auth.currentUser?.displayName || "No Name",
            email: auth.currentUser?.email || "No Email",
            avatar: null,
            bio: "",
            id: userId,
          });

          const allReportsSnapshot = await getDocs(collection(db, "reports"));
          const fetchedReports = allReportsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const userReports = fetchedReports.filter((r) => r.userId === userId);

          setReports(userReports);
          setAllReports(fetchedReports);
          setTotalReports(fetchedReports.length);
        }
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need access to your gallery to upload an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImage(result.assets[0].uri);
      setShowSaveConfirm(true); // 👈 show save popup
    }
  };


  const saveImage = async () => {
    if (!selectedImage) return;
    try {
      setUploading(true);
      const fileExt = selectedImage.split(".").pop();
      const mimeType = mime.lookup(fileExt) || "application/octet-stream";
      const data = new FormData();

      data.append("file", {
        uri: selectedImage,
        type: mimeType,
        name: `upload.${fileExt}`,
      });
      data.append("upload_preset", "user_uploads");

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/datb9a7ad/image/upload",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const imageUrl = res.data.secure_url;

      const userId = auth.currentUser?.uid;
      if (userId) {
        await setDoc(doc(db, "users", userId), { avatar: imageUrl }, { merge: true });
        setCurrentUser((prev) => ({ ...prev, avatar: imageUrl }));
      }

      setSelectedImage(null);
      Alert.alert("Success", "Image uploaded successfully!");
    } catch (error) {
      console.log("Cloudinary Upload Error:", error);
      Alert.alert("Upload Failed", "Something went wrong while uploading to Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await updateDoc(doc(db, "users", userId), { avatar: null });
      setCurrentUser((prev) => ({ ...prev, avatar: null }));
      setSelectedImage(null);
      Alert.alert("Removed", "Profile image removed successfully!");
    } catch (error) {
      console.log("Remove image error:", error);
      Alert.alert("Error", "Could not remove image.");
    } finally {
      setShowPopup(false);
    }
  };

  const handleAvatarPress = () => {
    if (currentUser.avatar) setShowPopup(true);
    else pickImage();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color="#7CC242" />
      </View>
    );
  }

  const avatarSource = selectedImage
    ? { uri: selectedImage }
    : currentUser.avatar
    ? { uri: currentUser.avatar }
    : null;

  const displayReports = activeTab === "myReports" ? reports : savedReports;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#7CC242" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}>
            <Ionicons name="settings-outline" size={26} color="#7CC242" />
          </TouchableOpacity>
        </View>

        {/* Cover Photo */}
        <View style={[styles.coverPhotoContainer, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={120} color="#7CC242" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: themeColors.text }]}>{currentUser.fullName}</Text>
          <Text style={[styles.email, { color: themeColors.sub }]}>{currentUser.email}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={styles.editTxt}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => auth.signOut().then(() => navigation.navigate("LogIn"))}
            >
              <Text style={styles.logoutTxt}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.statNum, { color: themeColors.text }]}>{reports.length}</Text>
            <Text style={[styles.statLabel, { color: themeColors.sub }]}>My Reports</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.statNum, { color: themeColors.text }]}>{savedReports.length}</Text>
            <Text style={[styles.statLabel, { color: themeColors.sub }]}>Saved</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.statNum, { color: themeColors.text }]}>{totalFound}</Text>
            <Text style={[styles.statLabel, { color: themeColors.sub }]}>Found</Text>
          </View>
        </View>

        {/* Tabs for My Reports / Saved Reports */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "myReports" && styles.activeTab,
              { borderBottomColor: activeTab === "myReports" ? "#7CC242" : "transparent" }
            ]}
            onPress={() => setActiveTab("myReports")}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === "myReports" ? "#7CC242" : themeColors.sub }
            ]}>
              My Reports ({reports.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "saved" && styles.activeTab,
              { borderBottomColor: activeTab === "saved" ? "#7CC242" : "transparent" }
            ]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === "saved" ? "#7CC242" : themeColors.sub }
            ]}>
              Saved ({savedReports.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          {displayReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === "myReports" ? "document-outline" : "bookmark-outline"} 
                size={60} 
                color={themeColors.sub} 
              />
              <Text style={[styles.emptyText, { color: themeColors.sub }]}>
                {activeTab === "myReports" 
                  ? "You haven't reported anything yet."
                  : "You haven't saved any reports yet."}
              </Text>
            </View>
          ) : (
            displayReports.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => navigation.navigate("Details", { report: r })}
              >
                <View style={[styles.reportCard, { backgroundColor: themeColors.card }]}>
                  {r.photo ? (
                    <Image source={{ uri: r.photo }} style={styles.reportImage} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={100} color="#7CC242" style={{ marginRight: 12 }} />
                  )}
                  <View style={styles.reportInfo}>
                    <View style={styles.reportHeader}>
                      <Text style={[styles.reportName, { color: themeColors.text }]}>
                        {r.fullName || r.gender || "Unnamed Report"}
                      </Text>
                      {activeTab === "saved" && (
                        <Ionicons name="bookmark" size={20} color="#7CC242" />
                      )}
                    </View>
                    <Text style={[styles.reportLocation, { color: themeColors.sub }]}>
                      {r.lastSeenLocation || "Unknown Location"}
                    </Text>
                    <Text style={[styles.reportDetails, { color: themeColors.sub }]}>
                      {r.age} • {r.gender}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={[
                        styles.statusText,
                        { color: r.status === "found" ? "#7CC242" : "#E74C3C" }
                      ]}>
                        {r.status === "found" ? "Found" : "Still Searching"}
                      </Text>
                    </View>
                    <Text style={[styles.reportTime, { color: themeColors.sub }]}>
                      {r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Popup Modal */}
      <Modal visible={showPopup} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.popupContainer, { backgroundColor: themeColors.popupBg }]}>
              <TouchableOpacity
                style={styles.popupOption}
                onPress={() => {
                  setShowPopup(false);
                  pickImage();
                }}
              >
                <Text style={[styles.popupText, { color: themeColors.text }]}>⇄ Change Image</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity style={styles.popupOption} onPress={removeImage}>
                <Text style={[styles.popupText, { color: "#ff5555" }]}>🗑️ Remove Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Save Confirmation Popup */}
      <Modal visible={showSaveConfirm} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSaveConfirm(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.popupContainer, { backgroundColor: themeColors.popupBg }]}>
              <Text style={[styles.popupTitle, { color: themeColors.text, marginBottom: 10 }]}>
                Save this image as your profile picture?
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: "#7CC242" }]}
                  onPress={() => {
                    setShowSaveConfirm(false);
                    saveImage();
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: "#ccc" }]}
                  onPress={() => {
                    setShowSaveConfirm(false);
                    setSelectedImage(null);
                  }}
                >
                  <Text style={{ color: "#000", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      {uploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7CC242" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 10,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#7CC242" },
  coverPhotoContainer: { width: "100%", height: 180, marginTop: 10 },
  avatarContainer: {
    position: "absolute",
    bottom: -50,
    left: 20,
    borderWidth: 4,
    borderColor: "#121212",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#121212",
  },
  avatar: { width: 120, height: 120, borderRadius: 10 },
  profileInfo: { alignItems: "flex-start", paddingHorizontal: 18, marginTop: 60 },
  name: { fontSize: 22, fontWeight: "800" },
  email: { marginTop: 4 },
  actionRow: { flexDirection: "row", marginTop: 12 },
  editBtn: { backgroundColor: "#7CC242", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginRight: 8 },
  editTxt: { color: "white", fontWeight: "700" },
  logoutBtn: { backgroundColor: "gray", borderWidth: 1, borderColor: "#7CC242", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  logoutTxt: { color: "#fff", fontWeight: "700" },
  saveBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: "#7CC242", alignSelf: "flex-start" },
  saveTxt: { color: "white", fontWeight: "700", fontSize: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingHorizontal: 18 },
  statBox: { flex: 1, marginHorizontal: 4, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 4 },
  
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  section: { marginTop: 18, paddingHorizontal: 18 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: { textAlign: "center", fontSize: 14, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  popupContainer: {justifyContent: "center", alignItems: "center" , padding: 20,borderRadius: 10, borderWidth: 2, borderColor: "#7CC242", width: 300, },
  popupOption: { alignItems: "center", paddingVertical: 12 },
  popupText: { fontSize: 16, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 20 },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "#00000080", zIndex: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  reportCard: { 
    flexDirection: "row", 
    borderRadius: 12, 
    padding: 12, 
    marginVertical: 6, 
    minHeight: 125, 
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  reportImage: { width: 100, height: 100, borderRadius: 8, marginRight: 12, backgroundColor: "#f0f0f0" },
  reportInfo: { flex: 1, justifyContent: "center" },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reportName: { fontSize: 16, fontWeight: "600", flex: 1 },
  reportLocation: { fontSize: 14, marginTop: 2 },
  reportDetails: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reportTime: { fontSize: 12, marginTop: 4 },
  popupTitle: {
  fontSize: 16,
  fontWeight: "600",
  textAlign: "center",
  marginBottom: 12,
},
confirmBtn: {
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 8,
  marginHorizontal: 15,
},

});