// screens/MapScreen.jsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
  Keyboard,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [marker, setMarker] = useState(null);

  // ⚠️ Replace this with your actual Google Maps API key
  const GOOGLE_MAPS_API_KEY = "AIzaSyBNkhpJ5AKndXYUZ4G5aMYZ3oVc3jKqssQ";

  const handleSearch = async () => {
    if (!searchQuery) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      // 🧠 Debug log — this will show the full API response in your Metro console
      console.log("📍 Google Geocoding API response:", data);

      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;

        // Move map smoothly to the searched location
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000
          );
        }

        // Set marker
        setMarker({
          latitude: lat,
          longitude: lng,
          title: searchQuery,
          description: data.results[0].formatted_address,
        });

        Keyboard.dismiss();
      } else {
        // 🧩 Detailed alert to show the reason why the search failed
        Alert.alert(
          "Location Not Found",
          `Status: ${data.status}${
            data.error_message ? `\nError: ${data.error_message}` : ""
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error fetching location:", error);
      Alert.alert(
        "Error",
        "Error fetching location. Check your internet connection or API key."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={24}
          color="#333"
          style={{ marginHorizontal: 8 }}
        />
        <TextInput
          placeholder="Enter location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={{ marginHorizontal: 8 }}>
          <Ionicons name="checkmark-outline" size={28} color="#7CC242" />
        </TouchableOpacity>
      </View>

      {/* 🗺️ Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={{
          latitude: -25.7479, // Pretoria
          longitude: 28.2293,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {marker && (
          <Marker
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        )}
      </MapView>

      {/* 📱 Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={24} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => navigation.navigate("Report")}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map-outline" size={24} color="#7CC242" />
          <Text style={[styles.navText, { color: "#7CC242" }]}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("ProfilePage")}
        >
          <Ionicons name="person-outline" size={24} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: "absolute",
    top: height * 0.02,
    left: width * 0.03,
    right: width * 0.03,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 3,
    paddingHorizontal: width * 0.02,
  },
  searchInput: {
    flex: 1,
    height: height * 0.06,
    fontSize: width * 0.04,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: height * 0.015,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: width * 0.03, color: "black" },
  reportBtn: {
    backgroundColor: "#7CC242",
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: (width * 0.15) / 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -width * 0.075,
    elevation: 5,
  },
});
