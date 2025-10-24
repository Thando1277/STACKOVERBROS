// screens/Panic.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext"; // ✅ Added for dark/light mode

let Voice;
try {
  Voice = require("@react-native-voice/voice").default;
} catch (e) {
  Voice = null;
}

export default function Panic() {
  const nav = useNavigation();
  const { addReport } = useData();
  const { isDark } = useTheme(); // ✅ use theme

  const [anonymous, setAnonymous] = useState(false);
  const [severity, setSeverity] = useState("High");
  const [locationText, setLocationText] = useState("");
  const [gettingLoc, setGettingLoc] = useState(false);
  const [description, setDescription] = useState("");
  const [speechModalVisible, setSpeechModalVisible] = useState(false);
  const [isListeningNative, setIsListeningNative] = useState(false);

  const webRef = useRef(null);

  useEffect(() => {
    if (Voice) {
      Voice.onSpeechStart = () => setIsListeningNative(true);
      Voice.onSpeechEnd = () => setIsListeningNative(false);
      Voice.onSpeechResults = (e) => {
        const text = (e.value && e.value[0]) || "";
        setDescription((p) => (p ? p + " " + text : text));
      };
      Voice.onSpeechError = (e) => {
        console.warn("voice error", e);
        setIsListeningNative(false);
        Alert.alert("Speech error", e?.error || "Voice error");
      };

      if (Platform.OS === "android") {
        try {
          Voice.onSpeechPartialResults = (e) => {
            const text = (e.value && e.value[0]) || "";
            setDescription((p) => (p ? p + " " + text : text));
          };
        } catch (err) {}
      }
    }
    return () => {
      if (Voice) {
        Voice.destroy().then(() => Voice.removeAllListeners && Voice.removeAllListeners());
      }
    };
  }, []);

  const startStopNative = async () => {
    if (!Voice) {
      Alert.alert("Native voice not installed", "Using WebView fallback instead.");
      setSpeechModalVisible(true);
      return;
    }
    try {
      if (isListeningNative) {
        await Voice.stop();
        setIsListeningNative(false);
      } else {
        await Voice.start("en-US");
        setIsListeningNative(true);
      }
    } catch (err) {
      console.warn("voice start err", err);
      Alert.alert("Voice error", String(err));
    }
  };

  const speechHtml = `
  <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif}#box{width:100%;max-width:420px;padding:16px;text-align:center}button{padding:14px 22px;border-radius:8px;border:0;background:#2E7D32;color:white;font-size:18px}#status{margin-top:12px;color:#333}</style></head><body><div id="box"><button id="btn">Start Listening</button><div id="status">Press to start</div></div><script>const Speech = window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){document.getElementById('status').innerText='SpeechRecognition not available';document.getElementById('btn').disabled=true;}else{const rec=new Speech();rec.lang='en-US';rec.continuous=false;rec.interimResults=false;let listening=false;rec.onstart=()=>{listening=true;document.getElementById('status').innerText='Listening...';document.getElementById('btn').textContent='Stop'};rec.onend=()=>{listening=false;document.getElementById('status').innerText='Stopped';document.getElementById('btn').textContent='Start Listening'};rec.onerror=(e)=>{window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',error:e.error}));};rec.onresult=(evt)=>{const t=evt.results[0][0].transcript;window.ReactNativeWebView.postMessage(JSON.stringify({type:'result',text:t}));};document.getElementById('btn').addEventListener('click',()=>{if(listening)rec.stop();else rec.start();});}</script></body></html>
  `;

  const reverseGeocode = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { headers: { "User-Agent": "FindSOSApp/1.0" } });
      const data = await res.json();
      return data.display_name || `${lat}, ${lon}`;
    } catch (e) {
      console.warn("reverse geocode err", e);
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
      setGettingLoc(false);
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Couldn't get location.");
      setGettingLoc(false);
    }
  };

  const onWebviewMessage = (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === "result") {
        setDescription((prev) => (prev ? prev + " " + data.text : data.text));
        setSpeechModalVisible(false);
      } else if (data.type === "error") {
        Alert.alert("Speech error", data.error || "Speech error");
      }
    } catch (err) {
      console.warn("webview message parse failed", err);
    }
  };

  const sendAlert = () => {
    if (!locationText || !description.trim()) {
      Alert.alert("Missing info", "Please get location and provide a description (or use speech).");
      return;
    }
    const payload = {
      reporter: anonymous ? "Anonymous" : "John Doe",
      severity,
      location: locationText,
      description,
      type: "Panic",
      createdAt: new Date().toISOString(),
      status: "search",
    };
    addReport(payload);
    Alert.alert("Success", "Panic alert submitted.");
    nav.navigate("Alerts");
  };

  const sevColor = (s) => {
    switch ((s || "").toLowerCase()) {
      case "low":
        return "#4CAF50";
      case "medium":
        return "#FFB300";
      case "high":
        return "#FF7043";
      case "urgent":
        return "#D32F2F";
      default:
        return "#999";
    }
  };

  // ✅ Apply dynamic theme colors
  const bg = isDark ? "#121212" : "#fff";
  const text = isDark ? "#eee" : "#000";
  const subText = isDark ? "#bbb" : "#555";
  const inputBg = isDark ? "#1e1e1e" : "#fafafa";
  const borderColor = isDark ? "#333" : "#e6e6e6";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
        <Text style={[styles.title, { color: text }]}>EMERGENCY REPORT</Text>

        <View style={styles.identityRow}>
          <Ionicons name="person-circle-outline" size={28} color={subText} />
          <Text style={[styles.identityText, { color: text }]}>
            Report as {anonymous ? "Anonymous" : "John Doe"}
          </Text>

          <TouchableOpacity
            style={[
              styles.anonBtn,
              anonymous ? { backgroundColor: "#2E7D32" } : {},
            ]}
            onPress={() => setAnonymous((v) => !v)}
          >
            <Text style={styles.anonBtnText}>
              {anonymous ? "Report as User" : "REPORT ANONYMOUSLY"}
            </Text>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: text }]}>SEVERITY LEVEL</Text>
        <View style={styles.severityRow}>
          {["Low", "Medium", "High", "URGENT"].map((s) => {
            const active = severity === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sevChip,
                  { backgroundColor: active ? sevColor(s) : "#f2f2f2" },
                ]}
                onPress={() => setSeverity(s)}
              >
                <Text
                  style={[
                    styles.sevChipText,
                    { color: active ? "#fff" : text },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16, color: text }]}>LOCATION</Text>
        <TouchableOpacity
          style={styles.getLocBtn}
          onPress={getLocation}
          disabled={gettingLoc}
        >
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
            {
              backgroundColor: inputBg,
              borderColor: borderColor,
              color: text,
            },
          ]}
          placeholder="Briefly describe what happened..."
          placeholderTextColor={subText}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.orText, { color: subText }]}>OR</Text>

        <View style={{ alignItems: "center" }}>
          {Voice ? (
            <TouchableOpacity style={styles.micBtn} onPress={startStopNative}>
              <Ionicons
                name={isListeningNative ? "stop-circle-outline" : "mic"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setSpeechModalVisible(true)}
            >
              <Ionicons name="mic" size={26} color="#fff" />
            </TouchableOpacity>
          )}
          <Text
            style={{
              marginTop: 10,
              fontWeight: "700",
              color: text,
            }}
          >
            {Voice
              ? isListeningNative
                ? "Listening..."
                : "Tap to speak (native)"
              : "Record (WebView fallback)"}
          </Text>
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={sendAlert}>
          <Text style={styles.sendText}>SEND ALERT</Text>
        </TouchableOpacity>

        <Modal
          visible={speechModalVisible}
          animationType="slide"
          onRequestClose={() => setSpeechModalVisible(false)}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.webHeader}>
              <TouchableOpacity
                onPress={() => setSpeechModalVisible(false)}
                style={{ padding: 12 }}
              >
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
              <Text style={{ fontWeight: "700", fontSize: 16 }}>Speech to Text</Text>
              <View style={{ width: 44 }} />
            </View>

            <WebView
              originWhitelist={["*"]}
              source={{ html: speechHtml }}
              onMessage={onWebviewMessage}
              javaScriptEnabled
              ref={webRef}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>
      </ScrollView>
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
    backgroundColor: "#2E7D32",
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
  webHeader: {
    height: 60,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    elevation: 2,
  },
});
