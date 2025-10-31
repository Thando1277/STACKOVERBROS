import React, { useState, useRef } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../Firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import SuccessCheck from "../components/SuccessCheck";
import { useTheme } from "../context/ThemeContext";

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
  const successRef = useRef();
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
  const [submitting, setSubmitting] = useState(false);
  const [crimeWantedFor, setCrimeWantedFor] = useState("");
  const [armedWith, setArmedWith] = useState("");
  const [rewardOffered, setRewardOffered] = useState("");

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access photos.");
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
      alert("Please fill all required fields: " + missing.join(", "));
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to submit a report.");
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photo) {
        const data = new FormData();
        data.append("file", {
          uri: Platform.OS === "ios" ? photo.replace("file://", "") : photo,
          type: "image/jpeg",
          name: `report-${Date.now()}.jpg`,
        });
        data.append("upload_preset", "UserPosts");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dpo2fiwoz/image/upload",
          { method: "POST", body: data }
        );
        const json = await res.json();
        if (!json.secure_url) throw new Error("Cloudinary upload failed");
        photoUrl = json.secure_url;
      }

      const payload = {
        fullName: fullName.trim(),
        age: Number(age),
        gender,
        type,
        photo: photoUrl || null,
        lastSeenDate: lastSeenDate.toISOString(),
        lastSeenLocation,
        description,
        contactName,
        contactNumber,
        status: "search",
        userId: user.uid,
        createdAt: serverTimestamp(),
        ...(type === "Wanted" && {
          crimeWantedFor: crimeWantedFor.trim(),
          armedWith: armedWith.trim(),
          rewardOffered: rewardOffered.trim(),
        }),
      };

      await addDoc(collection(db, "reports"), payload);

      if (successRef.current) successRef.current.play();
      setTimeout(() => {
        setSubmitting(false);
        navigation.goBack();
      }, 900);
    } catch (error) {
      console.error("Firestore error:", error);
      alert("Error saving report. Check your internet or Firebase setup.");
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
      if (selectedDate && selectedDate <= new Date()) {
        setLastSeenDate(selectedDate);
      } else if (selectedDate) {
        Alert.alert("Invalid Date", "Please select today or a past date.");
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
      setShowDatePicker(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#1f1f1f" : "#fff" },
        ]}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={isDark ? "#7CC242" : "#7CC242"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#7CC242" : "#7CC242" },
            ]}
          >
            Submit Report
          </Text>
          <View style={{ width: 28 }} />
        </View>

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
            placeholder="Bob Smith"
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
              mode="date"
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
            placeholder="John Doe"
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
            placeholder="0710000000"
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

        <SuccessCheck ref={successRef} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
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
});
