import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";


export default function DetailsScreen({ route }) {
  const { report } = route.params;
  const navigation = useNavigation();
  const user = auth.currentUser;


  const handleDelete = async () => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reports", report.id));
              Alert.alert("Deleted", "The report has been successfully deleted.");
              navigation.goBack(); // return to profile
            } catch (error) {
              console.error("Error deleting report:", error);
              Alert.alert("Error", "Failed to delete the report. Please try again.");
            }
          },
        },
      ]
    );
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#222" /></TouchableOpacity>
      </View>

      {report.photo ? <Image source={{ uri: report.photo }} style={styles.image} /> : null}

      <Text style={styles.title}>{report.fullName}</Text>
      <Text style={styles.sub}>{report.age} • {report.gender} • {report.type}</Text>

      <Text style={styles.section}>Last Seen</Text>
      <Text style={styles.text}>{report.lastSeenDate ? new Date(report.lastSeenDate).toLocaleString() : "N/A"}</Text>
      <Text style={styles.text}>{report.lastSeenLocation}</Text>

      <Text style={styles.section}>Description</Text>
      <Text style={styles.text}>{report.description || "N/A"}</Text>

      <Text style={styles.section}>Contact</Text>
      <Text style={styles.text}>Name: {report.contactName || "N/A"}</Text>
      <Text style={styles.text}>Phone: {report.contactNumber || "N/A"}</Text>

      <Text style={styles.small}>
        Reported: {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : "N/A"}
      </Text>

      {user && report.userId === user.uid && (
        <View style={styles.deleteContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>Delete Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,
    backgroundColor: "#fff",
    padding: 16 },
  headerRow: { 
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
    },
  image: {
    width: "100%", 
    height: 260, 
    borderRadius: 10, 
    marginBottom: 12 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#222", 
    marginBottom: 6 
  },
  sub: { 
    fontSize: 15, 
    color: "#555", 
    marginBottom: 12 
  },
  section: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#7CC242", 
    marginTop: 12, 
    marginBottom: 6 
  },
  text: { 
    fontSize: 15, 
    color: "#333", 
    marginBottom: 8 
  },
  small: { 
    fontSize: 12, 
    color: "#999", 
    marginTop: 12
  },

  //Delete Button Styles
  deleteContainer: {
  marginTop: 20,
  alignItems: "center",
  marginBottom: 40,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    elevation: 3,
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

});
