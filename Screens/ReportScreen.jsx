import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  Modal,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useData } from "../context/DataContext";
import SuccessCheck from "../components/SuccessCheck";

function Select({ label, value, onSelect, options }) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || label;
  return (
    <>
      <Pressable style={styles.inputBox} onPress={() => setOpen(true)}>
        <Text style={styles.placeholder}>{currentLabel} ▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
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
        </Pressable>
      </Modal>
    </>
  );
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const { addReport } = useData();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("Person");
  const [photo, setPhoto] = useState(null);

  const [lastSeenDate, setLastSeenDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [description, setDescription] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const successRef = useRef();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  };

  const validate = () => {
    if (!fullName.trim() || !age.trim() || !gender || !type || !photo || !lastSeenDate || !lastSeenLocation.trim()) {
      return false;
    }
    if (contactNumber && contactNumber.length !== 10) {
      alert("Contact number must be exactly 10 digits.");
      return false;
    }
    if (lastSeenDate > new Date()) {
      alert("Last Seen Date cannot be in the future.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    const payload = {
      fullName: fullName.trim(),
      age: age.trim(),
      gender,
      type,
      photo,
      lastSeenDate,
      lastSeenLocation,
      description,
      contactName,
      contactNumber,
      ageGroup: (() => {
        const n = parseInt(age, 10);
        if (!isNaN(n)) {
          if (n <= 12) return "child";
          if (n <= 19) return "teen";
          if (n <= 40) return "adult";
          return "senior";
        }
        return "";
      })(),
    };

    addReport(payload);

    if (successRef.current) successRef.current.play();

    setTimeout(() => {
      setSubmitting(false);
      navigation.goBack();
    }, 900);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate && selectedDate <= new Date()) {
      setLastSeenDate(selectedDate);
    } else if (selectedDate) {
      Alert.alert("Invalid Date", "Please select today or a past date.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Personal Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Names*</Text>
        <TextInput style={styles.input} placeholder="Bob Smith" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>Age*</Text>
        <TextInput style={styles.input} placeholder="30" keyboardType="numeric" value={age} onChangeText={setAge} />

        <Text style={styles.label}>Gender*</Text>
        <Select
          label="Gender"
          value={gender}
          onSelect={setGender}
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Person / Pet*</Text>
        <Select
          label="Type"
          value={type}
          onSelect={setType}
          options={[
            { label: "Person", value: "Person" },
            { label: "Pet", value: "Pet" },
          ]}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Recent Photo*</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadText}>{photo ? "Change Photo" : "Upload Recent Photo"}</Text>
        </TouchableOpacity>
        {photo && <Image source={{ uri: photo }} style={styles.preview} />}
      </View>

      {/* Last Seen Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last Seen Information</Text>

        <Text style={styles.label}>Last Seen Date & Time*</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.placeholder}>{lastSeenDate.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={lastSeenDate}
            mode="datetime"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Last Seen Location*</Text>
        <TextInput
          style={styles.input}
          placeholder="Brixton, Johannesburg"
          value={lastSeenLocation}
          onChangeText={setLastSeenLocation}
        />

        <Text style={styles.label}>Person Description</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          placeholder="Short description (height, clothing, marks...)"
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Contact Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        <Text style={styles.label}>Contact Name</Text>
        <TextInput style={styles.input} placeholder="John Doe" value={contactName} onChangeText={setContactName} />

        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+27 71 000 0000"
          keyboardType="phone-pad"
          value={contactNumber}
          onChangeText={setContactNumber}
          maxLength={10}
        />
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
        <Text style={styles.submitText}>Submit Report</Text>
      </TouchableOpacity>

      <SuccessCheck ref={successRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, elevation: 2, borderWidth: 1, borderColor: "#eee" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#7CC242", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6, color: "#222" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: "#fafafa" },
  inputBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, backgroundColor: "#fafafa" },
  placeholder: { color: "#666", fontWeight: "600" },
  uploadBtn: { backgroundColor: "#7CC242", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 8 },
  uploadText: { color: "#fff", fontWeight: "800" },
  preview: { width: "100%", height: 220, marginTop: 10, borderRadius: 8 },
  submitBtn: { backgroundColor: "#7CC242", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomColor: "#eee", borderBottomWidth: 1 },
  optionText: { fontSize: 15, color: "#222" },
  clearBtn: { marginTop: 10, alignSelf: "flex-end", backgroundColor: "#e0e0e0", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  clearText: { color: "#444", fontWeight: "600" },
});
