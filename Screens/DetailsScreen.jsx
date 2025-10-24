import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext"; // ✅ ThemeContext
import { Alert } from "react-native";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";


export default function DetailsScreen({ route }) {
  const { report } = route.params;
  const navigation = useNavigation();
  const { isDark } = useTheme();

  // ---------- Theme Colors ----------
  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#E0E0E0" : "#222",
    subText: isDark ? "#aaa" : "#555",
    section: "#7CC242",
    textLight: isDark ? "#ccc" : "#333",
    small: isDark ? "#777" : "#999",
  };
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
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.gotToInboxBtn}
            onPress={() => navigation.navigate('ChatScreen',
              {
                user: {
                  id: report.userId,
                  fullName: report.fullName,
                  avatar: report.avatar,
                }
              }
            )}
          >
            <Text>Go to inbox</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Reported: {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : "N/A"}

        </Text>
      </View>

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
    width: "90%",
    height: 280,
    marginHorizontal: "5%",
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
  gotToInboxBtn: {
    width: 100,
    height: 50
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
    width: "90%",
    elevation: 3,
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

});
