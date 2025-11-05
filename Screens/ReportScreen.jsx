// ReportScreen.js - Enhanced with better offline support
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../Firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { OfflineReportManager } from "../utils/OfflineReportManager";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get('window');

// Custom Success Modal
const SuccessModal = ({ visible, message, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.successBox, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#7CC242" />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.successButton}>
            <Text style={styles.successButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

function Select({ label, value, onSelect, options, isDark }) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <>
      <Pressable
        style={[
          styles.inputBox,
          {
            backgroundColor: isDark ? "#2b2b2b" : "#fafafa",
            borderColor: isDark ? "#444" : "#ddd",
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            styles.placeholder,
            { color: isDark ? "#ccc" : "#666" },
          ]}
        >
          {currentLabel} ▼
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: isDark ? "#333" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#fff" : "#000" },
              ]}
            >
              {String(label)}
            </Text>

            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={styles.optionRow}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? "#eee" : "#222" },
                  ]}
                >
                  {String(opt.label)}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.clearBtn,
                { backgroundColor: isDark ? "#555" : "#e0e0e0" },
              ]}
              onPress={() => {
                onSelect("");
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.clearText,
                  { color: isDark ? "#ddd" : "#444" },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("Person");
  const [photo, setPhoto] = useState(null);
  const [lastSeenDate, setLastSeenDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [crimeWantedFor, setCrimeWantedFor] = useState("");
  const [armedWith, setArmedWith] = useState("");
  const [rewardOffered, setRewardOffered] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Check for pending offline reports and network status
  useEffect(() => {
    checkPendingReports();
    
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      
      if (connected) {
        syncOfflineReports();
      }
    });
    
    return () => unsubscribe();
  }, []);

  const checkPendingReports = async () => {
    const count = await OfflineReportManager.getPendingCount();
    setPendingCount(count);
  };

  const syncOfflineReports = async () => {
    const count = await OfflineReportManager.getPendingCount();
    if (count === 0) return;

    Alert.alert(
      "Sync Offline Reports",
      `You have ${count} pending report(s). Would you like to sync them now?`,
      [
        { text: "Later", style: "cancel" },
        {
          text: "Sync Now",
          onPress: async () => {
            const result = await OfflineReportManager.syncOfflineReports(
              (current, total, report) => {
                console.log(`Syncing ${current}/${total}: ${report.fullName}`);
              }
            );

            if (result.success) {
              await checkPendingReports();
              setSuccessMessage(`Successfully synced ${result.synced} report(s).`);
              setShowSuccess(true);
            } else {
              Alert.alert("Sync Failed", result.error || "Please try again later.");
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Permission required to access photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(String(result.assets[0].uri));
    }
  };

  const validate = () => {
    const missing = [];
    if (!fullName.trim()) missing.push("Full Name");
    if (!age.trim()) missing.push("Age");
    if (!gender) missing.push("Gender");
    if (!type) missing.push("Type");
    if (!photo) missing.push("Photo");
    if (!lastSeenDate) missing.push("Last Seen Date");
    if (!lastSeenLocation.trim()) missing.push("Last Seen Location");
    if (type === "Wanted") {
      if (!crimeWantedFor.trim()) missing.push("Crime wanted for");
      if (!armedWith.trim()) missing.push("Armed with");
      if (!rewardOffered.trim()) missing.push("Reward offered");
    }
    if (missing.length) {
      Alert.alert("Missing Fields", "Please fill all required fields:\n" + missing.join(", "));
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Required", "You must be logged in to submit a report.");
      return;
    }
    setSubmitting(true);

    const reportPayload = {
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      type,
      photo: photo,
      lastSeenDate: lastSeenDate.toISOString(),
      lastSeenLocation: lastSeenLocation.trim(),
      description: description.trim(),
      contactName: contactName.trim(),
      contactNumber: contactNumber.trim(),
      userId: user.uid,
      ...(type === "Wanted" && {
        crimeWantedFor: crimeWantedFor.trim(),
        armedWith: armedWith.trim(),
        rewardOffered: rewardOffered.trim(),
      }),
    };

    // If offline, save for later sync
    if (!isConnected) {
      const result = await OfflineReportManager.saveOfflineReport(reportPayload);
      
      if (result.success) {
        setSubmitting(false);
        setSuccessMessage("Report saved offline. It will be submitted when you're back online.");
        setShowSuccess(true);
      } else {
        setSubmitting(false);
        Alert.alert("Error", "Failed to save report offline. Please try again.");
      }
      return;
    }

    // Online submission
    try {
      let photoUrl = null;
      
      if (photo) {
        const uploadResult = await OfflineReportManager.uploadPhoto(photo);
        if (!uploadResult.success) {
          throw new Error("Failed to upload photo");
        }
        photoUrl = uploadResult.url;
      }

      const payload = {
        ...reportPayload,
        photo: photoUrl,
        status: "search",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reports"), payload);

      setSubmitting(false);
      setSuccessMessage("Report submitted successfully!");
      setShowSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      
      Alert.alert(
        "Submission Failed",
        "Could not submit report online. Would you like to save it for later?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save Offline",
            onPress: async () => {
              const result = await OfflineReportManager.saveOfflineReport(reportPayload);
              if (result.success) {
                setSuccessMessage("Report saved offline. It will be submitted when online.");
                setShowSuccess(true);
              }
            },
          },
        ]
      );
      
      setSubmitting(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        if (selectedDate <= new Date()) {
          setTempDate(selectedDate);
          setShowTimePicker(true);
        } else {
          Alert.alert("Invalid Date", "Please select today or a past date.");
        }
      }
    } else {
      // iOS - closes picker when done
      setShowDatePicker(false);
      if (selectedDate && selectedDate <= new Date()) {
        setLastSeenDate(selectedDate);
      } else if (selectedDate) {
        Alert.alert("Invalid Date", "Please select today or a past date and time.");
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedTime) {
      const combined = new Date(tempDate);
      combined.setHours(selectedTime.getHours());
      combined.setMinutes(selectedTime.getMinutes());
      if (combined <= new Date()) {
        setLastSeenDate(combined);
      } else {
        Alert.alert("Invalid Date/Time", "Please select a past date and time.");
      }
    }
  };

  const openDateTimePicker = () => {
    if (Platform.OS === "android") {
      setTempDate(lastSeenDate);
      setShowDatePicker(true);
    } else {
      // iOS shows datetime picker
      setShowDatePicker(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? "#1f1f1f" : "#fff" }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Fixed Header */}
        <View style={[styles.header, { backgroundColor: isDark ? "#1f1f1f" : "#fff" }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={28}
              color="#7CC242"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Report</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Offline/Pending Reports Banner */}
          {!isConnected && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={20} color="#fff" />
              <Text style={styles.offlineText}>Offline Mode - Reports will sync when online</Text>
            </View>
          )}

          {pendingCount > 0 && (
            <TouchableOpacity style={styles.pendingBanner} onPress={syncOfflineReports}>
              <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.pendingText}>
                {pendingCount} pending report{pendingCount > 1 ? "s" : ""} - Tap to sync
              </Text>
            </TouchableOpacity>
          )}

          {/* Personal Info */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#fff",
                borderColor: isDark ? "#333" : "#eee",
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: isDark ? "#7CC242" : "#7CC242" },
              ]}
            >
              Personal Information
            </Text>

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Full Name*
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="Sibusiso Ndlovu"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Age*
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="30"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Gender*
            </Text>
            <Select
              label="Gender"
              value={gender}
              onSelect={setGender}
              isDark={isDark}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Report Type*
            </Text>
            <Select
              label="Type"
              value={type}
              onSelect={setType}
              isDark={isDark}
              options={[
                { label: "Person", value: "Person" },
                { label: "Pet", value: "Pet" },
                { label: "Wanted", value: "Wanted" },
              ]}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Recent Photo*
            </Text>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: "#7CC242" }]}
              onPress={pickImage}
            >
              <Text style={styles.uploadText}>
                {photo ? "Change Photo" : "Upload Recent Photo"}
              </Text>
            </TouchableOpacity>
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}
          </View>

          {/* Last Seen Info */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#fff",
                borderColor: isDark ? "#333" : "#eee",
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: isDark ? "#7CC242" : "#7CC242" },
              ]}
            >
              Last Seen Information
            </Text>

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Last Seen Date & Time*
            </Text>
            <TouchableOpacity
              style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              onPress={openDateTimePicker}
            >
              <Text
                style={[styles.placeholder, { color: isDark ? "#ccc" : "#666" }]}
              >
                {lastSeenDate.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={Platform.OS === "android" ? tempDate : lastSeenDate}
                mode={Platform.OS === "ios" ? "datetime" : "date"}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Last Seen Location*
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="Brixton, Johannesburg"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              value={lastSeenLocation}
              onChangeText={setLastSeenLocation}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  height: 90,
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="Short description (height, clothing, marks...)"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {type === "Wanted" && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? "#2a2a2a" : "#fff",
                  borderColor: isDark ? "#333" : "#eee",
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? "#7CC242" : "#7CC242" },
                ]}
              >
                Wanted Details
              </Text>
              <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
                Crime wanted for*
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#333" : "#fafafa",
                    color: isDark ? "#fff" : "#000",
                    borderColor: isDark ? "#444" : "#ddd",
                  },
                ]}
                placeholder="e.g. Robbery, Fraud"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                value={crimeWantedFor}
                onChangeText={setCrimeWantedFor}
              />

              <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
                Armed with*
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#333" : "#fafafa",
                    color: isDark ? "#fff" : "#000",
                    borderColor: isDark ? "#444" : "#ddd",
                  },
                ]}
                placeholder="e.g. Firearm, Knife"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                value={armedWith}
                onChangeText={setArmedWith}
              />

              <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
                Reward offered*
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#333" : "#fafafa",
                    color: isDark ? "#fff" : "#000",
                    borderColor: isDark ? "#444" : "#ddd",
                  },
                ]}
                placeholder="e.g. R10,000"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                value={rewardOffered}
                onChangeText={setRewardOffered}
              />
            </View>
          )}

          {/* Reporter Contact */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#fff",
                borderColor: isDark ? "#333" : "#eee",
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: isDark ? "#7CC242" : "#7CC242" },
              ]}
            >
              Reporter Contact
            </Text>

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Contact Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="Sibusiso Ndlovu"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={[styles.label, { color: isDark ? "#ccc" : "#222" }]}>
              Contact Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#fafafa",
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#444" : "#ddd",
                },
              ]}
              placeholder="0712345678"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              keyboardType="phone-pad"
              value={contactNumber}
              onChangeText={setContactNumber}
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: "#7CC242", opacity: submitting ? 0.7 : 1 },
            ]}
            onPress={submit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccess}
          message={successMessage}
          onClose={() => {
            setShowSuccess(false);
            navigation.goBack();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#7CC242" 
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  offlineText: { color: "#fff", fontWeight: "600", flex: 1 },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  pendingText: { color: "#fff", fontWeight: "600", flex: 1 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  placeholder: { fontWeight: "600" },
  uploadBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  uploadText: { color: "#fff", fontWeight: "800" },
  preview: { width: "100%", height: 220, marginTop: 10, borderRadius: 8 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: {
    paddingVertical: 12,
    borderBottomColor: "#444",
    borderBottomWidth: 0.5,
  },
  optionText: { fontSize: 15 },
  clearBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearText: { fontWeight: "600" },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#7CC242',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 120,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
