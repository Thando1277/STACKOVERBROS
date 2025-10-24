import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
  Keyboard,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { db } from "../Firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const { width, height } = Dimensions.get("window");
const GOOGLE_MAPS_API_KEY = "AIzaSyBNkhpJ5AKndXYUZ4G5aMYZ3oVc3jKqssQ";

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMarker, setSearchMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "reports"));
        const reports = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const report = { id: doc.id, ...doc.data() };
            
            // Only geocode if we have a location but no coordinates
            if (report.lastSeenLocation && !report.latitude && !report.longitude) {
              try {
                const response = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                    report.lastSeenLocation + ", South Africa"
                  )}&key=${GOOGLE_MAPS_API_KEY}`
                );
                const data = await response.json();
                if (data.status === "OK" && data.results.length > 0) {
                  report.latitude = data.results[0].geometry.location.lat;
                  report.longitude = data.results[0].geometry.location.lng;
                }
              } catch (err) {
                console.warn("Geocoding failed for", report.lastSeenLocation, err);
              }
            }
            return report;
          })
        );
        
        // Filter reports that have valid coordinates
        const validMarkers = reports.filter(
          r => r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude)
        );
        
        console.log(`Loaded ${validMarkers.length} reports with valid coordinates`);
        setMarkers(validMarkers);
      } catch (error) {
        console.error("Error fetching reports:", error);
        Alert.alert("Error", "Could not load reports from Firebase.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery + ", South Africa"
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;

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

        setSearchMarker({
          latitude: lat,
          longitude: lng,
          title: searchQuery,
          description: data.results[0].formatted_address,
        });

        Keyboard.dismiss();
      } else {
        Alert.alert(
          "Location Not Found",
          `Could not find "${searchQuery}". Please try a different location.`
        );
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert(
        "Error",
        "Could not search location. Check your internet connection."
      );
    }
  };

  const getPinColor = (type) => {
    switch (type) {
      case "Person":
        return "purple";
      case "Pet":
        return "blue";
      case "Wanted":
        return "red";
      default:
        return "green";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={24} color="#333" style={{ marginHorizontal: 8 }} />
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

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CC242" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={{
          latitude: -25.7479,
          longitude: 28.2293,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {/* Firebase markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: parseFloat(marker.latitude),
              longitude: parseFloat(marker.longitude),
            }}
            pinColor={getPinColor(marker.type)}
            onPress={() => {
              console.log("Marker pressed:", marker.fullName);
              setSelectedMarker(marker);
            }}
          />
        ))}

        {/* Search result marker */}
        {searchMarker && (
          <Marker
            coordinate={{
              latitude: searchMarker.latitude,
              longitude: searchMarker.longitude,
            }}
            title={searchMarker.title}
            description={searchMarker.description}
            pinColor="orange"
          />
        )}
      </MapView>

      {/* Details Card - Shows when marker is pressed */}
      {selectedMarker && (
        <View style={styles.detailsCard}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedMarker(null)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Text style={styles.nameText}>{selectedMarker.fullName || "Unknown"}</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.typeBadgeText, { 
              backgroundColor: getPinColor(selectedMarker.type),
            }]}>
              {selectedMarker.type || "Unknown"}
            </Text>
          </View>
          
          {selectedMarker.gender && (
            <Text style={styles.descText}>
              <Text style={styles.labelText}>Gender: </Text>
              {selectedMarker.gender}
            </Text>
          )}
          
          {selectedMarker.description && (
            <Text style={styles.descText}>
              <Text style={styles.labelText}>Description: </Text>
              {selectedMarker.description}
            </Text>
          )}
          
          {selectedMarker.lastSeenDate && (
            <Text style={styles.descText}>
              <Text style={styles.labelText}>Last Seen: </Text>
              {formatDate(selectedMarker.lastSeenDate)}
            </Text>
          )}
          
          {selectedMarker.lastSeenLocation && (
            <Text style={styles.descText}>
              <Text style={styles.labelText}>Location: </Text>
              {selectedMarker.lastSeenLocation}
            </Text>
          )}
          
          {selectedMarker.photo && (
            <Image
              source={{ uri: selectedMarker.photo }}
              style={styles.detailPhoto}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={24} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate("Report")}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map-outline" size={24} color="#7CC242" />
          <Text style={[styles.navText, { color: "#7CC242" }]}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("ProfilePage")}>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    paddingHorizontal: width * 0.02,
  },
  searchInput: { 
    flex: 1, 
    height: height * 0.06, 
    fontSize: width * 0.04,
  },
  loadingContainer: {
    position: "absolute",
    top: height * 0.4,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutContainer: {
    width: 260,
  },
  calloutCard: { 
    width: 260,
    padding: 12, 
    backgroundColor: "white", 
    borderRadius: 10,
  },
  nameText: { 
    fontWeight: "bold", 
    fontSize: 18, 
    marginBottom: 6,
    color: "#333",
  },
  infoRow: {
    marginBottom: 8,
  },
  typeBadgeText: {
    fontWeight: "600", 
    fontSize: 12,
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  labelText: {
    fontWeight: "600",
    color: "#555",
  },
  descText: { 
    fontSize: 14, 
    marginBottom: 4,
    color: "#666",
    lineHeight: 20,
  },
  photo: { 
    width: "100%", 
    height: 140, 
    marginTop: 8, 
    borderRadius: 8,
  },
  detailsCard: {
    position: "absolute",
    bottom: height * 0.1,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    maxHeight: height * 0.6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  detailPhoto: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
});