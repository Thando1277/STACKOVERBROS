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
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from "expo-location";
import { Audio } from 'expo-av';
import { useData } from "../context/DataContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { auth, db, storage } from "../Firebase/firebaseConfig";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Panic() {
  const nav = useNavigation();
  const { addReport } = useData();
  const { isDark } = useTheme();

  const [anonymous, setAnonymous] = useState(false);
  const [severity, setSeverity] = useState("High");
  const [locationText, setLocationText] = useState("");
  const [gettingLoc, setGettingLoc] = useState(false);
  const [description, setDescription] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const lastGeocodingRequest = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Request audio recording permissions
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is needed for voice recording.'
          );
        }
      } catch (error) {
        console.error('Permission request error:', error);
      }
    })();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("No authenticated user");
          return;
        }
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserInfo(snap.data());
        } else {
          console.warn("User document not found");
        }
      } catch (e) {
        console.error("Error fetching user info:", e);
        Alert.alert("Error", "Failed to load user information.");
      }
    };
    fetchUser();
  }, []);

  // Reverse geocode with rate limiting
  const reverseGeocode = async (lat, lon) => {
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastGeocodingRequest.current;
      if (timeSinceLastRequest < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
      }
      lastGeocodingRequest.current = Date.now();

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "FindSOSApp/1.0 (emergency-panic-app)"
        }
      });

      if (!res.ok) {
        throw new Error(`Geocoding failed: ${res.status}`);
      }

      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  // Get location
  const getLocation = async () => {
    try {
      setGettingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow location access to send panic alerts.");
        setGettingLoc(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLocationText(address);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Couldn't get location. Please try again.");
    } finally {
      setGettingLoc(false);
    }
  };

  // Upload audio to Firebase Storage
  const uploadAudioToStorage = async (uri) => {
    try {
      console.log('🎤 Starting audio upload from:', uri);
      
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error('XHR Error:', e);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      console.log('✅ Blob created, size:', blob.size);

      const user = auth.currentUser;
      const filename = `panic_audio_${user.uid}_${Date.now()}.m4a`;
      const storageRef = ref(storage, `panic-reports/${filename}`);
      
      console.log('📤 Uploading to:', filename);

      await uploadBytes(storageRef, blob, { contentType: 'audio/m4a' });
      console.log('✅ Upload complete!');

      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ Download URL:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Upload Failed', error.message);
      return null;
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Audio.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone access is required for voice notes.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  // Stop audio recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      console.log('Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      console.log('Recording stopped at', uri);

      Alert.alert('✓ Saved', 'Voice note recorded successfully!');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Could not save recording.');
    }
  };

  // Play/Pause audio
  const togglePlayAudio = async () => {
    try {
      if (!audioUri) return;

      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio.');
    }
  };

  // Delete audio recording
  const deleteAudio = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (sound) {
              await sound.unloadAsync();
              setSound(null);
            }
            setAudioUri(null);
            setIsPlaying(false);
          },
        },
      ]
    );
  };

  // Handle record button press
  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle back button press
  const handleGoBack = () => {
    if (audioUri || description.trim() || locationText) {
      Alert.alert(
        'Discard Report?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => nav.navigate("Home")
          }
        ]
      );
    } else {
      nav.navigate("Home");
    }
  };

  // Send panic alert with Firebase Storage upload
  const sendAlert = async () => {
    if (!locationText || (!description.trim() && !audioUri)) {
      Alert.alert("Missing Information", "Please get your location and provide a description or voice note.");
      return;
    }

    const reporterName = anonymous
      ? "Anonymous"
      : userInfo?.fullname || userInfo?.name || "Unknown User";

    try {
      setIsUploading(true);

      let audioDownloadURL = null;
      if (audioUri) {
        console.log('🎤 Uploading audio to Firebase Storage...');
        audioDownloadURL = await uploadAudioToStorage(audioUri);
        
        if (!audioDownloadURL) {
          setIsUploading(false);
          Alert.alert("Error", "Failed to upload audio. Please try again.");
          return;
        }
      }

      const payload = {
        reporter: reporterName,
        reporterAvatar: anonymous
          ? "https://cdn-icons-png.flaticon.com/512/456/456141.png"
          : userInfo?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        severity,
        location: locationText,
        description: description.trim() || "Voice note attached",
        audioUrl: audioDownloadURL,
        type: "Panic",
        createdAt: new Date().toISOString(),
        status: "search",
        comments: [],
      };

      console.log('💾 Saving to Firestore with audioUrl:', audioDownloadURL);

      addReport(payload);
      await addDoc(collection(db, "reports"), payload);

      setIsUploading(false);

      Alert.alert("✓ Alert Sent", "Emergency responders have been notified.", [
        { text: "OK", onPress: () => nav.navigate("Home") }
      ]);
    } catch (e) {
      console.error("❌ Error:", e);
      setIsUploading(false);
      Alert.alert("Error", `Failed to submit: ${e.message}`);
    }
  };

  // Colors
  const bg = isDark ? "#0a0a0a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a1a" : "#ffffff";
  const text = isDark ? "#ffffff" : "#1a1a1a";
  const subText = isDark ? "#a0a0a0" : "#666666";
  const inputBg = isDark ? "#252525" : "#f9f9f9";
  const borderColor = isDark ? "#333333" : "#e0e0e0";

  const sevColorGradient = (s) => {
    switch ((s || "").toLowerCase()) {
      case "low": return ['#4CAF50', '#66BB6A'];
      case "medium": return ['#FFB300', '#FFC107'];
      case "high": return ['#FF7043', '#FF8A65'];
      case "urgent": return ['#D32F2F', '#E53935'];
      default: return ['#999', '#bbb'];
    }
  };

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      {/* Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: cardBg }]} 
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color={text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#D32F2F', '#B71C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Ionicons name="warning" size={32} color="#fff" />
          <Text style={styles.headerTitle}>EMERGENCY ALERT</Text>
          <Text style={styles.headerSubtitle}>Report a critical situation</Text>
        </LinearGradient>

        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: cardBg }]}>
          {/* Identity Section */}
          <View style={styles.section}>
            <View style={styles.identityRow}>
              <Image
                source={{
                  uri: anonymous
                    ? "https://cdn-icons-png.flaticon.com/512/456/456141.png"
                    : userInfo?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                style={styles.avatar}
              />
              <View style={styles.identityInfo}>
                <Text style={[styles.identityName, { color: text }]}>
                  {anonymous ? "Anonymous Reporter" : userInfo?.fullname || "User"}
                </Text>
                <Text style={[styles.identityLabel, { color: subText }]}>Reporter Identity</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.toggleBtn, anonymous && styles.toggleBtnActive]}
              onPress={() => setAnonymous(v => !v)}
            >
              <Ionicons 
                name={anonymous ? "eye-off" : "eye"} 
                size={18} 
                color="#fff" 
              />
              <Text style={styles.toggleBtnText}>
                {anonymous ? "Anonymous" : "Make Anonymous"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Severity Level */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              <Ionicons name="alert-circle" size={16} color={sevColor(severity)} /> Severity Level
            </Text>
            <View style={styles.severityRow}>
              {["Low", "Medium", "High", "Urgent"].map(s => {
                const active = severity === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSeverity(s)}
                    style={styles.sevChipContainer}
                  >
                    {active ? (
                      <LinearGradient
                        colors={sevColorGradient(s)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sevChip}
                      >
                        <Text style={styles.sevChipTextActive}>{s.toUpperCase()}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.sevChip, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
                        <Text style={[styles.sevChipText, { color: subText }]}>{s.toUpperCase()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              <Ionicons name="location" size={16} color="#2E7D32" /> Your Location
            </Text>
            <TouchableOpacity 
              style={[styles.locationBtn, gettingLoc && styles.locationBtnLoading]} 
              onPress={getLocation} 
              disabled={gettingLoc}
            >
              <LinearGradient
                colors={['#2E7D32', '#388E3C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.locationBtnGradient}
              >
                {gettingLoc ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="navigate" size={20} color="#fff" />
                )}
                <Text style={styles.locationBtnText}>
                  {gettingLoc ? "Getting Location..." : "Get My Location"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {locationText ? (
              <View style={[styles.locationCard, { backgroundColor: inputBg }]}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={[styles.locationText, { color: text }]} numberOfLines={2}>
                  {locationText}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              <Ionicons name="document-text" size={16} color="#FF7043" /> Description
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: inputBg, 
                borderColor, 
                color: text 
              }]}
              placeholder="Describe the emergency situation..."
              placeholderTextColor={subText}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Voice Recording */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>
              <Ionicons name="mic" size={16} color="#7CC242" /> Voice Note (Optional)
            </Text>
            
            <View style={styles.voiceSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording
                  ]}
                  onPress={handleRecordPress}
                  disabled={isUploading}
                >
                  <LinearGradient
                    colors={isRecording ? ['#D32F2F', '#B71C1C'] : ['#7CC242', '#66BB6A']}
                    style={styles.micButtonGradient}
                  >
                    <Ionicons 
                      name={isRecording ? "stop" : "mic"} 
                      size={32} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={[styles.micLabel, { color: isRecording ? '#D32F2F' : subText }]}>
                {isRecording ? "● Recording... Tap to Stop" : "Tap to Record"}
              </Text>
            </View>

            {/* Audio Player */}
            {audioUri && (
              <View style={[styles.audioPlayer, { backgroundColor: inputBg, borderColor }]}>
                <TouchableOpacity onPress={togglePlayAudio} style={styles.audioPlayBtn}>
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color="#2E7D32" 
                  />
                </TouchableOpacity>
                <View style={styles.audioInfo}>
                  <Text style={[styles.audioTitle, { color: text }]}>
                    Voice Note Recorded
                  </Text>
                  <Text style={[styles.audioStatus, { color: subText }]}>
                    {isPlaying ? "● Playing..." : "Ready to send"}
                  </Text>
                </View>
                <TouchableOpacity onPress={deleteAudio} style={styles.audioDeleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Upload Status */}
          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={[styles.uploadingText, { color: subText }]}>
                Uploading emergency report...
              </Text>
            </View>
          )}

          {/* Send Button */}
          <TouchableOpacity 
            style={[styles.sendBtn, isUploading && styles.sendBtnDisabled]} 
            onPress={sendAlert}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isUploading ? ['#999', '#bbb'] : ['#D32F2F', '#B71C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendBtnGradient}
            >
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.sendBtnText}>
                {isUploading ? "SENDING..." : "SEND EMERGENCY ALERT"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginTop: 8,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  identityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  identityName: {
    fontSize: 16,
    fontWeight: "700",
  },
  identityLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#666",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: "#2E7D32",
  },
  toggleBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  sevChipContainer: {
    flex: 1,
  },
  sevChip: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  sevChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sevChipTextActive: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  locationBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  locationBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  locationBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  voiceSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#7CC242",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    shadowColor: "#D32F2F",
  },
  micButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  micLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  audioPlayer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  audioPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  audioInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  audioStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  audioDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sendBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  sendBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
