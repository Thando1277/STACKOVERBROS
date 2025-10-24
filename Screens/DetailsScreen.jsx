import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function DetailsScreen({ route }) {
  const { report } = route.params;
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Image */}
      {report.photo ? (
        <Image source={{ uri: report.photo }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={60} color="#aaa" />
          <Text style={styles.noImageText}>No Photo Available</Text>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.name}>{report.fullName}</Text>
        <Text style={styles.subText}>
          {report.age} • {report.gender} • {report.type}
        </Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Last Seen</Text>
          <Text style={styles.sectionText}>{report.lastSeenDate}</Text>
          <Text style={styles.sectionText}>{report.lastSeenLocation}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>
            {report.description || "No description provided."}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionText}>Name: {report.contactName || "N/A"}</Text>
          <Text style={styles.sectionText}>Phone: {report.contactNumber || "N/A"}</Text>
        </View>

        <Text style={styles.footerText}>
          Reported on {new Date(report.createdAt).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    elevation: 2,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginTop: 50
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  image: {
    width: "100%",
    height: 280,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    resizeMode: "cover",
  },
  noImage: {
    width: "100%",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  noImageText: {
    marginTop: 6,
    color: "#999",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },
  subText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4EAF50",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginTop: 12,
    textAlign: "right",
  },
});
