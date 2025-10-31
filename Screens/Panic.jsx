import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { auth, db } from "../Firebase/firebaseConfig";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";

export default function Panic() {
  const nav = useNavigation();
  const { addReport } = useData();
  const { isDark } = useTheme();

  const [anonymous, setAnonymous] = useState(false);
  const [severity, setSeverity] = useState("High");
  const [locationText, setLocationText] = useState("");
  const [gettingLoc, setGettingLoc] = useState(false);
  const [description, setDescription] = useState("");
  const [speechModalVisible, setSpeechModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const webRef = useRef(null);

  // ✅ Load user info
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

  // 📍 Location
  const reverseGeocode = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { headers: { "User-Agent": "FindSOSApp/1.0" } });
      const data = await res.json();
      return data.display_name || `${lat}, ${lon}`;
    } catch {
      return `${lat}, ${lon}`;
    }
  };

  const getLocation = async () => {
    try {
      setGettingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow location access.");
        setGettingLoc(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLocationText(address);
    } catch {
      Alert.alert("Error", "Couldn't get location.");
    } finally {
      setGettingLoc(false);
    }
  };

  // 🚨 Send alert with Firestore
  const sendAlert = async () => {
    if (!locationText || !description.trim()) {
      Alert.alert("Missing info", "Please get location and provide a description (or use speech).");
      return;
    }

    const reporterName = anonymous
      ? "Anonymous"
      : userInfo?.fullname || userInfo?.name || "Unknown User";

    const payload = {
      reporter: reporterName,
      reporterAvatar: anonymous
        ? "https://cdn-icons-png.flaticon.com/512/456/456141.png"
        : userInfo?.avatar || null,
      severity,
      location: locationText,
      description,
      type: "Panic",
      createdAt: new Date().toISOString(),
      status: "search",
      comments: [],
    };

    try {
      // 1️⃣ Add locally
      addReport(payload);

      // 2️⃣ Add to Firestore
      await addDoc(collection(db, "reports"), payload);

      Alert.alert("Success", "Panic alert submitted.");
      nav.navigate("Alerts");
    } catch (e) {
      console.error("Error saving panic report:", e);
      Alert.alert("Error", "Failed to submit panic alert. Please try again.");
    }
  };

  // 🎙 Web Speech API fallback
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
    <h3>Tap to Speak</h3>
    <button id="startVoice" style="padding:14px 30px;font-size:18px;border:none;border-radius:10px;background-color:#2E7D32;color:#fff;">
      🎤 Start Speaking
    </button>
    <p id="status" style="margin-top:20px;font-size:16px;"></p>

    <script>
      const btn = document.getElementById('startVoice');
      const status = document.getElementById('status');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        status.innerText = 'Speech recognition not supported on this device.';
      } else {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;

        btn.addEventListener('click', () => {
          try {
            recognition.start();
            status.innerText = 'Listening...';
          } catch (e) {}
        });

        recognition.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          window.ReactNativeWebView.postMessage(transcript);
          status.innerText = 'Received: ' + transcript;
        };
        recognition.onerror = recognition.onend = () => {
          status.innerText = 'Stopped listening.';
        };
      }
    </script>
  </body>
  </html>`;

  const startStopNative = () => setSpeechModalVisible(true);

  // 🔵 Colors
  const bg = isDark ? "#121212" : "#fff";
  const text = isDark ? "#cfcfcf" : "#000";
  const subText = isDark ? "#bbb" : "#555";
  const inputBg = isDark ? "#1e1e1e" : "#fafafa";
  const borderColor = isDark ? "#333" : "#e6e6e6";

  const sevColor = (s) => {
    switch ((s || "").toLowerCase()) {
      case "low": return "#4CAF50";
      case "medium": return "#FFB300";
      case "high": return "#FF7043";
      case "urgent": return "#D32F2F";
      default: return "#999";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
        <Text style={[styles.title, { color: text }]}>EMERGENCY REPORT</Text>

        {/* Identity row */}
        <View style={styles.identityRow}>
          <Image
            source={{
              uri: anonymous
                ? "https://cdn-icons-png.flaticon.com/512/456/456141.png"
                : userInfo?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
          <Text style={[styles.identityText, { color: text }]}>
            Report as {anonymous ? "Anonymous" : userInfo?.fullname || "User"}
          </Text>

          <TouchableOpacity
            style={[styles.anonBtn, anonymous ? { backgroundColor: "#2E7D32" } : {}]}
            onPress={() => setAnonymous((v) => !v)}
          >
            <Text style={styles.anonBtnText}>
              {anonymous ? "Report as User" : "REPORT ANONYMOUSLY"}
            </Text>
            <Ionicons name="shield-checkmark" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: text }]}>SEVERITY LEVEL</Text>
        <View style={styles.severityRow}>
          {["Low", "Medium", "High", "URGENT"].map((s) => {
            const active = severity === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.sevChip, { backgroundColor: active ? sevColor(s) : "#f2f2f2" }]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.sevChipText, { color: active ? "#fff" : text }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16, color: text }]}>LOCATION</Text>
        <TouchableOpacity style={styles.getLocBtn} onPress={getLocation} disabled={gettingLoc}>
          {gettingLoc ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.getLocText}>GET MY LOCATION</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.locText, { color: subText }]}>
          {locationText ? locationText : "No location yet"}
        </Text>

        <TextInput
          style={[
            styles.description,
            { backgroundColor: inputBg, borderColor: borderColor, color: text },
          ]}
          placeholder="Briefly describe what happened..."
          placeholderTextColor={subText}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.orText, { color: subText }]}>OR</Text>

        <View style={{ alignItems: "center" }}>
          <TouchableOpacity style={styles.micBtn} onPress={startStopNative}>
            <Ionicons name="mic" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ marginTop: 10, fontWeight: "700", color: text }}>Tap to Speak</Text>
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={sendAlert}>
          <Text style={styles.sendText}>SEND ALERT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* WebView modal */}
      <Modal visible={speechModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            onMessage={(event) => {
              const text = event.nativeEvent.data;
              setSpeechModalVisible(false);
              if (text) {
                setDescription((prev) => (prev ? prev + " " + text : text));
              }
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 12 },
  identityRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  identityText: { flex: 1, marginLeft: 10, fontSize: 15 },
  anonBtn: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: "center",
  },
  anonBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", marginTop: 6, marginBottom: 6 },
  severityRow: { flexDirection: "row", justifyContent: "space-between" },
  sevChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  sevChipText: { fontWeight: "800" },
  getLocBtn: {
    marginTop: 6,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  getLocText: { color: "#fff", marginLeft: 10, fontWeight: "800" },
  locText: { marginTop: 8, fontSize: 13 },
  description: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },
  orText: { textAlign: "center", marginVertical: 12, fontWeight: "800" },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#7CC242",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtn: {
    marginTop: 16,
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  sendText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
