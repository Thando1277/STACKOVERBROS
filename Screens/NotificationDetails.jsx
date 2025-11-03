import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from 'expo-av';

export default function NotificationDetails({ route, navigation }) {
  const { report } = route.params;
  
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const sevColor = (s) => {
    switch ((s || "").toLowerCase()) {
      case "low": return "#2ecc71";
      case "medium": return "#f39c12";
      case "high": return "#e74c3c";
      case "urgent": return "#8e44ad";
      default: return "#999";
    }
  };

  const openMaps = () => {
    // Use exact coordinates if available
    if (report.coords && report.coords.latitude && report.coords.longitude) {
      const { latitude, longitude } = report.coords;
      const url =
        Platform.OS === "ios"
          ? `maps:0,0?q=${latitude},${longitude}`
          : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      Linking.openURL(url).catch(() => alert("Unable to open maps"));
      return;
    }

    // Fallback to address string
    const loc = report.location || report.lastSeenLocation;
    if (!loc) {
      alert("No location available.");
      return;
    }

    const q = encodeURIComponent(loc);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url).catch(() => alert("Unable to open maps"));
  };

  // Play or pause audio
  const togglePlayAudio = async () => {
    try {
      if (!report.audioUrl) return;

      if (sound) {
        // If sound exists, play or pause
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Load and play for the first time
        setIsLoading(true);
        const newSound = new Audio.Sound();
        
        await newSound.loadAsync({ uri: report.audioUrl });
        await newSound.playAsync();
        
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);

        // Handle playback finish
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Could not play audio. Please try again.');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  // Check if description is empty/missing
  const hasDescription = report.description && report.description.trim() !== "";
  const hasAudio = report.audioUrl || report.audioUri;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={[styles.header, { backgroundColor: sevColor(report.severity) }]}>
          <Text style={styles.headerText}>{(report.severity || "ALERT").toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={report.photo ? { uri: report.photo } : require("../assets/dude.webp")} style={styles.avatar} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontWeight: "900", fontSize: 18 }}>{report.reporter || report.fullName || "Unknown"}</Text>
              <Text style={{ color: "#777", marginTop: 4 }}>{report.type} • {report.age ? report.age + " yrs" : "—"} • {report.gender || "—"}</Text>
            </View>
          </View>

          {/* Show description if available */}
          {hasDescription && (
            <Text style={{ marginTop: 12, color: "#333", fontSize: 15 }}>
              {report.description}
            </Text>
          )}

          {/* Show audio player if no description or if audio is available */}
          {hasAudio && (
            <View style={styles.audioPlayer}>
              <TouchableOpacity 
                onPress={togglePlayAudio} 
                style={styles.playButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={48} 
                    color="#2E7D32" 
                  />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: "700", fontSize: 16 }}>
                  {hasDescription ? "Voice Note" : "Description (Voice Note)"}
                </Text>
                <Text style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                  {isLoading ? "Loading..." : isPlaying ? "Playing..." : "Tap to play"}
                </Text>
              </View>
            </View>
          )}

          {/* Show "No description" only if no description AND no audio */}
          {!hasDescription && !hasAudio && (
            <Text style={{ marginTop: 12, color: "#999", fontSize: 15, fontStyle: "italic" }}>
              No description provided.
            </Text>
          )}

          <Text style={{ marginTop: 12, color: "#666" }}>
            <Text style={{ fontWeight: "700" }}>Location: </Text>{report.location || report.lastSeenLocation || "Unknown"}
          </Text>

          <Text style={{ marginTop: 8, color: "#666" }}>
            <Text style={{ fontWeight: "700" }}>When: </Text>{new Date(report.createdAt).toLocaleString()}
          </Text>

          <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.mapBtnText}>Open in Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.mapBtn, { backgroundColor: "#555", marginTop: 8 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.mapBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  headerText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 8 },
  audioPlayer: {
    marginTop: 16,
    backgroundColor: "#f0f9f4",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4edda",
  },
  playButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  mapBtn: { 
    marginTop: 14, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#2f9e44", 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  mapBtnText: { color: "#fff", marginLeft: 8, fontWeight: "900" },
});
