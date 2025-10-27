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
import { auth, db, storage } from "../Firebase/firebaseConfig";
import { doc, getDoc, collection, getDocs, query, where, updateDoc,setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import * as FileSystem from "expo-file-system";
import axios from 'axios';
import * as mime from 'react-native-mime-types';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [currentUser, setCurrentUser] = useState({
    fullName: "",
    email: "",
    avatar: null,
    bio: "",
    id: "",
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [totalReports, setTotalReports] = useState(0);

  const [allReports, setAllReports] = useState([]);
  const totalFound = allReports.filter(r => r.status === "found").length;





  // Fetch user info & reports
  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Fetched user data:", data);
          setCurrentUser({
            fullName: data.fullname || data.fullName || data.name || "No Name",
            email: data.email || auth.currentUser?.email || "No Email",
            avatar: data.avatar || null,
            bio: data.bio || "",
            id: userId,
          });
        } else {
          // Document doesn't exist, use auth data as fallback
          setCurrentUser({
            fullName: auth.currentUser?.displayName || "No Name",
            email: auth.currentUser?.email || "No Email",
            avatar: null,
            bio: "",
            id: userId,
          });
        }

        

        // const reportsQuery = query(collection(db, "reports"), where("userId", "==", userId));
        // const reportsSnapshot = await getDocs(reportsQuery);
        // const userReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // setReports(userReports);

        // // Fetch total reports
        // const totalSnapshot = await getDocs(collection(db, "reports"));
        // setTotalReports(totalSnapshot.size);

        const allReportsSnapshot = await getDocs(collection(db, "reports"));
        const fetchedReports  = allReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userReports = fetchedReports.filter(report => report.userId === userId);

        setReports(userReports);
        setTotalReports(fetchedReports.length);
        setAllReports(fetchedReports);

      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Pick and edit image
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
    }
  };

  // Save picked image
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
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = res.data.secure_url;

      const userId = auth.currentUser?.uid;
      if (userId) {
        await setDoc(
        doc(db, "users", userId),
        { avatar: imageUrl },
        { merge: true } // merges with existing fields if present
      )
        
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

  // Remove avatar
  const removeImage = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Remove the avatar field from Firestore
    await updateDoc(doc(db, "users", userId), { avatar: null });

    // Update the local state
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7CC242" />
      </View>
    );
  }

  const avatarSource = selectedImage
    ? { uri: selectedImage }
    : currentUser.avatar
    ? { uri: currentUser.avatar }
    : null;

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Cover Photo Area */}
        <View style={styles.coverPhotoContainer}>
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
          <Text style={styles.name}>{currentUser.fullName}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>

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

          {selectedImage && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveImage}>
              <Text style={styles.saveTxt}>Save Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{reports.length}</Text>
            <Text style={styles.statLabel}>My Reports</Text>
          </View>

        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalReports}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>

          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalFound}</Text>
            <Text style={styles.statLabel}>Found</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Reports</Text>

          {reports.length === 0 ? (
          <Text style={styles.emptyText}>You haven't reported anything yet.</Text>
            ) : (
            reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              // onPress={() => navigation.navigate("ReportDetails", { report })
              onPress={() => navigation.navigate("Details", { report })}
            >
              <Image
                source={{ uri: report.photo }}
                style={styles.reportImage}
              />
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>
                  {report.fullName || "Unnamed Report"}
                </Text>
                <Text style={styles.reportLocation}>
                  {report.lastSeenLocation || "Unknown Location"}
                </Text>
                <Text style={styles.reportTime}>
                  {report.createdAt?.seconds
                    ? new Date(report.createdAt.seconds * 1000).toLocaleString()
                    : ""}
                </Text>
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
            <View style={styles.popupContainer}>
              <TouchableOpacity
                style={styles.popupOption}
                onPress={() => {
                  setShowPopup(false);
                  pickImage();
                }}
              >
                <Text style={styles.popupText}>⇄ Change Image</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.popupOption} onPress={removeImage}>
                <Text style={[styles.popupText, { color: "#ff5555" }]}>🗑️ Remove Image</Text>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "#121212" },
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
  coverPhotoContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#1e1e1e",
    position: "relative",
    marginTop: 10,
  },
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
  name: { fontSize: 22, fontWeight: "800", color: "#fff" },
  email: { color: "#ccc", marginTop: 4 },
  phone: { color: "#aaa", marginTop: 2, fontSize: 12 },
  actionRow: { flexDirection: "row", marginTop: 12 },
  editBtn: {
    backgroundColor: "#7CC242",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  editTxt: { color: "white", fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#7CC242",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutTxt: { color: "#fff", fontWeight: "700" },
  saveBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#7CC242",
    alignSelf: "flex-start",
  },
  saveTxt: { color: "white", fontWeight: "700", fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 12, color: "#aaa", marginTop: 4 },
  section: { marginTop: 18, paddingHorizontal: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#7CC242" },
  emptyText: { color: "#aaa" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7CC242",
    width: 250,
    paddingVertical: 10,
  },
  popupOption: {
    alignItems: "center",
    paddingVertical: 12,
  },
  popupText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000080",
    zIndex: 10,
  },
  reportCard: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    borderWidth:0.1,
    borderColor:"#18da69ff",
    padding: 12,
    marginVertical: 6,
    height: 125,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },
  reportImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  reportInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reportName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fffafaff",
  },
  reportLocation: {
    fontSize: 14,
    color: "#9b9999ff",
    marginTop: 2,
  },
  reportTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 20,
  },
});

