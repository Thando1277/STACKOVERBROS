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
  Dimensions,
  Platform,
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
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  withDelay,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive breakpoints
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
const isLargeDevice = SCREEN_WIDTH >= 768;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

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
  const [activeTab, setActiveTab] = useState("myReports");
  const [showStats, setShowStats] = useState(false);

  // Animation values
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const stat1Scale = useSharedValue(0);
  const stat2Scale = useSharedValue(0);
  const stat3Scale = useSharedValue(0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);


  const totalFound = allReports.filter((r) => r.status === "found").length;

  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#FAFAFA",
    card: isDark ? "#2A2A2A" : "#FFFFFF",
    text: isDark ? "#E0E0E0" : "#1A1A1A",
    sub: isDark ? "#aaa" : "#666",
    border: isDark ? "#333" : "#E5E5E5",
    popupBg: isDark ? "#2B2B2B" : "#fff",
    chartBg: isDark ? "#2A2A2A" : "#FFFFFF",
  };

  // Handle dimension changes (orientation, etc)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

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
          
          const savedReportIds = data.savedReports || [];
          
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
        animateStats();
      }
    };

    fetchUserData();
  }, []);

  const animateStats = () => {
    statsOpacity.value = withTiming(1, { duration: 600 });
    statsTranslateY.value = withSpring(0);
    stat1Scale.value = withDelay(100, withSpring(1));
    stat2Scale.value = withDelay(200, withSpring(1));
    stat3Scale.value = withDelay(300, withSpring(1));
  };

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const stat1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stat1Scale.value }],
  }));

  const stat2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stat2Scale.value }],
  }));

  const stat3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stat3Scale.value }],
  }));

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

  // Generate chart data
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(() => Math.floor(Math.random() * 10) + 1);
    return { labels: months, data };
  };

  const monthlyData = getMonthlyData();

  const pieData = [
    {
      name: "Found",
      population: totalFound || 1,
      color: "#7CC242",
      legendFontColor: themeColors.text,
      legendFontSize: moderateScale(12),
    },
    {
      name: "Searching",
      population: (allReports.length - totalFound) || 1,
      color: "#FF6B6B",
      legendFontColor: themeColors.text,
      legendFontSize: moderateScale(12),
    },
  ];

  const chartConfig = {
    backgroundColor: themeColors.chartBg,
    backgroundGradientFrom: themeColors.chartBg,
    backgroundGradientTo: themeColors.chartBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 194, 66, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(224, 224, 224, ${opacity})` : `rgba(26, 26, 26, ${opacity})`,
    style: {
      borderRadius: moderateScale(16),
    },
    propsForDots: {
      r: moderateScale(6).toString(),
      strokeWidth: "2",
      stroke: "#7CC242",
    },
  };

  // Responsive chart width
  const chartWidth = dimensions.width - (isLargeDevice ? 80 : 56);
  const chartHeight = isSmallDevice ? 180 : 200;

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

  // Responsive avatar size
  const avatarSize = isSmallDevice ? 70 : isLargeDevice ? 100 : 80;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={moderateScale(28)} color="#7CC242" />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: moderateScale(24) }]}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("SettingsScreen")}>
            <Ionicons name="settings-outline" size={moderateScale(26)} color="#7CC242" />
          </TouchableOpacity>
        </View>

        {/* Profile Header Card */}
        <View style={[
          styles.profileCard, 
          { backgroundColor: themeColors.card },
          isLargeDevice && styles.profileCardLarge
        ]}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            {avatarSource ? (
              <Image source={avatarSource} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Ionicons name="person" size={moderateScale(50)} color="#7CC242" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileTextContainer}>
            <Text style={[styles.name, { color: themeColors.text, fontSize: moderateScale(20) }]}>
              {currentUser.fullName}
            </Text>
            <Text style={[styles.email, { color: themeColors.sub, fontSize: moderateScale(13) }]}>
              {currentUser.email}
            </Text>

            <View style={[styles.actionRow, isSmallDevice && styles.actionRowSmall]}>
              <TouchableOpacity
                style={[styles.editBtn, isSmallDevice && styles.btnSmall]}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Ionicons name="create-outline" size={moderateScale(16)} color="white" />
                <Text style={[styles.editTxt, { fontSize: moderateScale(13) }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutBtn, isSmallDevice && styles.btnSmall]}
                onPress={() => auth.signOut().then(() => navigation.navigate("LogIn"))}
              >
                <Ionicons name="log-out-outline" size={moderateScale(16)} color="#7CC242" />
                <Text style={[styles.logoutTxt, { fontSize: moderateScale(13) }]}>
                  {isSmallDevice ? "Out" : "Log Out"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Stats Cards */}
        <Animated.View style={[
          styles.statsContainer, 
          statsAnimatedStyle,
          isLargeDevice && styles.statsContainerLarge
        ]}>
          <Animated.View style={[
            styles.statCard, 
            { backgroundColor: themeColors.card }, 
            stat1AnimatedStyle,
            isLargeDevice && styles.statCardLarge
          ]}>
            <View style={[styles.statIconContainer, { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24) }]}>
              <Ionicons name="document-text" size={moderateScale(24)} color="#000000ff" />
            </View>
            <Text style={[styles.statNum, { color: themeColors.text, fontSize: moderateScale(24) }]}>
              {reports.length}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.sub, fontSize: moderateScale(11) }]}>
              My Reports
            </Text>
          </Animated.View>

          <Animated.View style={[
            styles.statCard, 
            { backgroundColor: themeColors.card }, 
            stat2AnimatedStyle,
            isLargeDevice && styles.statCardLarge
          ]}>
            <View style={[styles.statIconContainer, { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24) }]}>
              <Ionicons name="bookmark" size={moderateScale(24)} color="#000000ff" />
            </View>
            <Text style={[styles.statNum, { color: themeColors.text, fontSize: moderateScale(24) }]}>
              {savedReports.length}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.sub, fontSize: moderateScale(11) }]}>
              Saved
            </Text>
          </Animated.View>

          <Animated.View style={[
            styles.statCard, 
            { backgroundColor: themeColors.card }, 
            stat3AnimatedStyle,
            isLargeDevice && styles.statCardLarge
          ]}>
            <View style={[styles.statIconContainer, { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24) }]}>
              <Ionicons name="checkmark-circle" size={moderateScale(24)} color="#090b07ff" />
            </View>
            <Text style={[styles.statNum, { color: themeColors.text, fontSize: moderateScale(24) }]}>
              {totalFound}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.sub, fontSize: moderateScale(11) }]}>
              Found
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Analytics Section */}
        <TouchableOpacity 
          style={[styles.analyticsHeader, { backgroundColor: themeColors.card }]}
          onPress={() => setShowStats(!showStats)}
        >
          <View style={styles.analyticsHeaderLeft}>
            <Ionicons name="analytics" size={moderateScale(20)} color="#7CC242" />
            <Text style={[styles.analyticsTitle, { color: themeColors.text, fontSize: moderateScale(16) }]}>
              Analytics Overview
            </Text>
          </View>
          <Ionicons 
            name={showStats ? "chevron-up" : "chevron-down"} 
            size={moderateScale(20)} 
            color={themeColors.sub} 
          />
        </TouchableOpacity>

        {showStats && (
          <View style={styles.chartsContainer}>
            {/* Line Chart */}
            <View style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.chartTitle, { color: themeColors.text, fontSize: moderateScale(15) }]}>
                Monthly Activity
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels: monthlyData.labels,
                    datasets: [{ data: monthlyData.data }],
                  }}
                  width={chartWidth}
                  height={chartHeight}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>

            {/* Pie Chart */}
            <View style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.chartTitle, { color: themeColors.text, fontSize: moderateScale(15) }]}>
                Status Distribution
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <PieChart
                  data={pieData}
                  width={chartWidth}
                  height={chartHeight}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  absolute
                />
              </ScrollView>
            </View>

            {/* Bar Chart */}
            <View style={[styles.chartCard, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.chartTitle, { color: themeColors.text, fontSize: moderateScale(15) }]}>
                Reports Overview
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: isSmallDevice ? ["Reports", "Saved", "Found"] : ["My Reports", "Saved", "Found"],
                    datasets: [{ data: [reports.length || 1, savedReports.length || 1, totalFound || 1] }],
                  }}
                  width={chartWidth}
                  height={chartHeight}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              </ScrollView>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: activeTab === "myReports" ? "#7CC242" : "transparent" }
            ]}
            onPress={() => setActiveTab("myReports")}
          >
            <Text style={[
              styles.tabText,
              { 
                color: activeTab === "myReports" ? "#060805ff" : themeColors.sub,
                fontSize: moderateScale(14)
              }
            ]}>
              {isSmallDevice ? `Reports (${reports.length})` : `My Reports (${reports.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: activeTab === "saved" ? "#7CC242" : "transparent" }
            ]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={[
              styles.tabText,
              { 
                color: activeTab === "saved" ? "#060805ff" : themeColors.sub,
                fontSize: moderateScale(14)
              }
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
                size={moderateScale(60)} 
                color={themeColors.sub} 
              />
              <Text style={[styles.emptyText, { color: themeColors.sub, fontSize: moderateScale(14) }]}>
                {activeTab === "myReports" 
                  ? "You haven't reported anything yet."
                  : "You haven't saved any reports yet."}
              </Text>
            </View>
          ) : (
            displayReports.map((r) => {
              const reportImageSize = isSmallDevice ? 80 : 90;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => navigation.navigate("Details", { report: r })}
                >
                  <View style={[styles.reportCard, { backgroundColor: themeColors.card }]}>
                    {r.photo ? (
                      <Image 
                        source={{ uri: r.photo }} 
                        style={[
                          styles.reportImage, 
                          { width: reportImageSize, height: reportImageSize }
                        ]} 
                      />
                    ) : (
                      <View style={[
                        styles.reportImagePlaceholder,
                        { width: reportImageSize, height: reportImageSize }
                      ]}>
                        <Ionicons name="person" size={moderateScale(40)} color="#7CC242" />
                      </View>
                    )}
                    <View style={styles.reportInfo}>
                      <View style={styles.reportHeader}>
                        <Text style={[
                          styles.reportName, 
                          { color: themeColors.text, fontSize: moderateScale(16) }
                        ]} numberOfLines={1}>
                          {r.fullName || r.gender || "Unnamed Report"}
                        </Text>
                        {activeTab === "saved" && (
                          <Ionicons name="bookmark" size={moderateScale(18)} color="#7CC242" />
                        )}
                      </View>
                      <View style={styles.reportRow}>
                        <Ionicons name="location-outline" size={moderateScale(14)} color={themeColors.sub} />
                        <Text 
                          style={[styles.reportLocation, { color: themeColors.sub, fontSize: moderateScale(13) }]}
                          numberOfLines={1}
                        >
                          {r.lastSeenLocation || "Unknown Location"}
                        </Text>
                      </View>
                      <Text style={[styles.reportDetails, { color: themeColors.sub, fontSize: moderateScale(12) }]}>
                        {r.age} • {r.gender}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: r.status === "found" ? "#7CC24220" : "#FF6B6B20" }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { 
                            color: r.status === "found" ? "#7CC242" : "#FF6B6B",
                            fontSize: moderateScale(11)
                          }
                        ]}>
                          {r.status === "found" ? "● Found" : "● Searching"}
                        </Text>
                      </View>
                      <Text style={[styles.reportTime, { color: themeColors.sub, fontSize: moderateScale(11) }]}>
                        {r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ""}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Popup Modal */}
      <Modal visible={showPopup} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={[
              styles.popupContainer, 
              { backgroundColor: themeColors.popupBg },
              isSmallDevice && styles.popupContainerSmall
            ]}>
              <TouchableOpacity
                style={styles.popupOption}
                onPress={() => {
                  setShowPopup(false);
                  pickImage();
                }}
              >
                <Ionicons name="images-outline" size={moderateScale(20)} color="#7CC242" />
                <Text style={[styles.popupText, { color: themeColors.text, fontSize: moderateScale(15) }]}>
                  Change Image
                </Text>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

              <TouchableOpacity style={styles.popupOption} onPress={removeImage}>
                <Ionicons name="trash-outline" size={moderateScale(20)} color="#FF6B6B" />
                <Text style={[styles.popupText, { color: "#FF6B6B", fontSize: moderateScale(15) }]}>
                  Remove Image
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Save Confirmation Popup */}
      <Modal visible={showSaveConfirm} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSaveConfirm(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.popupContainer_2, { backgroundColor: themeColors.popupBg }]}>
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
          <Text style={[styles.uploadingText, { fontSize: moderateScale(14) }]}>Uploading...</Text>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: themeColors.bg, borderTopColor: themeColors.border }]}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={moderateScale(24)} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate("Alerts")}
        >
          <Ionicons name="notifications-outline" size={moderateScale(24)} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Alerts</Text>
        </TouchableOpacity>
        
        <View style={styles.navItem} />
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate("MapScreen")}
        >
          <Ionicons name="map-outline" size={moderateScale(24)} color={themeColors.text} />
          <Text style={[styles.navText, { color: themeColors.text }]}>Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate("ProfilePage")}
        >
          <Ionicons name="person" size={moderateScale(24)} color="#7CC242" />
          <Text style={[styles.navText, { color: "#7CC242" }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Report Button */}
      <TouchableOpacity 
        style={[
          styles.reportBtn,
          { 
            bottom: SCREEN_HEIGHT * 0.04,
            left: (SCREEN_WIDTH / 2) - (SCREEN_WIDTH * 0.075),
            width: SCREEN_WIDTH * 0.15,
            height: SCREEN_WIDTH * 0.15,
            borderRadius: SCREEN_WIDTH * 0.075,
          }
        ]} 
        onPress={() => navigation.navigate("Report")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={moderateScale(30)} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: verticalScale(100) },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
  },
  backBtn: { padding: scale(6) },
  title: { fontWeight: "700", color: "#7CC242", letterSpacing: 0.5 },
  
  // Profile Card
  profileCard: {
    marginHorizontal: scale(20),
    marginBottom: verticalScale(20),
    padding: scale(20),
    borderRadius: moderateScale(16),
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: "row",
    alignItems: "center",
  },
  profileCardLarge: {
    paddingHorizontal: scale(30),
    paddingVertical: verticalScale(25),
  },
  avatarContainer: {
    marginRight: scale(16),
  },
  avatar: { 
    borderWidth: 2,
  },
  avatarPlaceholder: {
    backgroundColor: "#7CC24220",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7CC242",
  },
  profileTextContainer: { flex: 1 },
  name: { fontWeight: "700", marginBottom: verticalScale(4) },
  email: { marginBottom: verticalScale(12) },
  actionRow: { flexDirection: "row", gap: scale(8) },
  actionRowSmall: { gap: scale(6) },
  editBtn: { 
    backgroundColor: "#7CC242", 
    paddingVertical: moderateScale(8), 
    paddingHorizontal: moderateScale(16), 
    borderRadius: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  btnSmall: {
    paddingHorizontal: moderateScale(12),
  },
  editTxt: { color: "white", fontWeight: "600" },
  logoutBtn: { 
    backgroundColor: "transparent",
    borderWidth: 1.5, 
    borderColor: "#000000ff", 
    paddingVertical: moderateScale(8), 
    paddingHorizontal: moderateScale(16), 
    borderRadius: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  logoutTxt: { color: "#7CC242", fontWeight: "600" },
  saveBtn: { 
    marginTop: verticalScale(8), 
    paddingVertical: verticalScale(6), 
    paddingHorizontal: scale(12), 
    borderRadius: moderateScale(6), 
    backgroundColor: "#7CC242", 
    alignSelf: "flex-start" 
  },
  saveTxt: { color: "white", fontWeight: "600" },
  
  // Stats Cards
  statsContainer: { 
    flexDirection: "row", 
    paddingHorizontal: scale(20), 
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  statsContainerLarge: {
    paddingHorizontal: scale(30),
    gap: scale(15),
  },
  statCard: { 
    flex: 1, 
    paddingVertical: verticalScale(20), 
    borderRadius: moderateScale(12), 
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statCardLarge: {
    paddingVertical: verticalScale(25),
  },
  statIconContainer: {
    backgroundColor: "#00000015",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  statNum: { fontWeight: "800", marginBottom: verticalScale(4) },
  statLabel: { fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  
  // Analytics
  analyticsHeader: {
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    padding: scale(16),
    borderRadius: moderateScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  analyticsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  analyticsTitle: {
    fontWeight: "700",
  },
  chartsContainer: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  chartCard: {
    padding: scale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  chartTitle: {
    fontWeight: "700",
    marginBottom: verticalScale(12),
  },
  chart: {
    borderRadius: moderateScale(12),
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: scale(20),
    marginBottom: verticalScale(16),
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: "center",
    borderBottomWidth: 3,
  },
  tabText: {
    fontWeight: "600",
  },
  
  // Reports
  section: { 
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  emptyText: { 
    textAlign: "center", 
    marginTop: verticalScale(12),
    fontWeight: "500",
  },
  reportCard: { 
    flexDirection: "row", 
    borderRadius: moderateScale(12), 
    padding: scale(14), 
    marginBottom: verticalScale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  reportImage: { 
    borderRadius: moderateScale(10), 
    marginRight: scale(14),
  },
  reportImagePlaceholder: {
    borderRadius: moderateScale(10),
    backgroundColor: "#7CC24215",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(14),
  },
  reportInfo: { flex: 1, justifyContent: "space-between" },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  reportName: { fontWeight: "700", flex: 1 },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: verticalScale(4),
  },
  reportLocation: { flex: 1 },
  reportDetails: { marginBottom: verticalScale(6) },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    alignSelf: "flex-start",
    marginBottom: verticalScale(4),
  },
  statusText: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportTime: { marginTop: verticalScale(2) },
  
  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  popupContainer: { 
    borderRadius: moderateScale(16), 
    width: scale(280), 
    paddingVertical: verticalScale(8),
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  popupContainerSmall: {
    width: scale(250),
  },
  popupOption: { 
    flexDirection: "row",
    alignItems: "center", 
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    gap: scale(12),
  },
  popupText: { fontWeight: "600" },
  divider: { height: 1, marginHorizontal: scale(20) },
  
  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(11),
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  navItem: { 
    alignItems: "center",
    flex: 1,
  },
  navText: { 
    fontSize: moderateScale(11), 
    marginTop: verticalScale(4),
    fontWeight: "500",
  },
  
  // Report Button
  reportBtn: {
    position: "absolute",
    backgroundColor: "#7CC242",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  
  // Loading
  loadingOverlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.7)", 
    zIndex: 10 
  },
  uploadingText: {
    color: "white",
    marginTop: verticalScale(12),
    fontWeight: "600",
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  popupContainer_2: { 
    borderRadius: moderateScale(16), 
    width: scale(280),
    padding: scale(20),
  },
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