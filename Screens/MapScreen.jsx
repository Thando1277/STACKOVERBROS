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
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { db } from "../Firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const { width, height } = Dimensions.get("window");
const isIOS = Platform.OS === "ios";
const GOOGLE_MAPS_API_KEY = "AIzaSyBNkhpJ5AKndXYUZ4G5aMYZ3oVc3jKqssQ";

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMarker, setSearchMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "reports"));
        const reports = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const report = { id: doc.id, ...doc.data() };
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

        const validMarkers = reports.filter(
          r => r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude)
        );
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
          searchQuery + ","
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
    <>
      {/* Black status bar overlay */}
      <View style={styles.statusBarOverlay} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

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

        {/* Loading */}
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
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: parseFloat(marker.latitude),
                longitude: parseFloat(marker.longitude),
              }}
              pinColor={getPinColor(marker.type)}
              onPress={() => setSelectedMarker(marker)}
            />
          ))}
          {searchMarker && (
            <Marker
              coordinate={{
                latitude: searchMarker.latitude,
                longitude: searchMarker.longitude,
              }}
              title={searchMarker.title}
              description={searchMarker.description}
              pinColor="green"
            />
          )}
        </MapView>

        {/* Legend Toggle Button */}
        <TouchableOpacity 
          style={styles.legendToggle}
          onPress={() => setShowLegend(!showLegend)}
        >
          <Ionicons name="information-circle" size={28} color="#7CC242" />
        </TouchableOpacity>

        {/* Legend */}
        {showLegend && (
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Pin Colors</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'purple' }]} />
              <Text style={styles.legendText}>Person</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'blue' }]} />
              <Text style={styles.legendText}>Pet</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'red' }]} />
              <Text style={styles.legendText}>Wanted</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'green' }]} />
              <Text style={styles.legendText}>Search Location</Text>
            </View>
          </View>
        )}

        {/* Marker Details */}
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
              }]}>{selectedMarker.type || "Unknown"}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  statusBarOverlay: {
    height: isIOS ? 40 : StatusBar.currentHeight,
    backgroundColor: "black",
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 200,
  },
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: "absolute",
    top: isIOS ? height * 0.08 : height * 0.06,
    left: width * 0.03,
    right: width * 0.03,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: { 
    flex: 1, 
    height: height * 0.055, 
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
    marginTop: 8,
    fontSize: width * 0.035,
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
    borderRadius: width * 0.075,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -width * 0.075,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nameText: { 
    fontWeight: "bold", 
    fontSize: width * 0.045, 
    marginBottom: height * 0.005,
    color: "#333",
  },
  infoRow: { marginBottom: height * 0.008 },
  typeBadgeText: {
    fontWeight: "600", 
    fontSize: width * 0.03,
    color: "white",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  labelText: { fontWeight: "600", color: "#555" },
  descText: { 
    fontSize: width * 0.035, 
    marginBottom: height * 0.003,
    color: "#666",
    lineHeight: height * 0.025,
  },
  detailsCard: {
    position: "absolute",
    bottom: height * 0.1,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: width * 0.04,
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
    height: height * 0.25,
    marginTop: height * 0.01,
    borderRadius: 10,
  },
  legendToggle: {
    position: "absolute",
    top: isIOS ? height * 0.19 : height * 0.17,
    right: width * 0.05,
    backgroundColor: "#fff",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
  legendCard: {
    position: "absolute",
    top: isIOS ? height * 0.26 : height * 0.24,
    right: width * 0.05,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: width * 0.04,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 99,
    minWidth: width * 0.4,
  },
  legendTitle: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginBottom: height * 0.01,
    color: "#333",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: height * 0.005,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: width * 0.025,
  },
  legendText: {
    fontSize: width * 0.035,
    color: "#666",
  },
});