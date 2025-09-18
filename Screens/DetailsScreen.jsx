import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function DetailsScreen({ route }) {
  const { report } = route.params;
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#222" /></TouchableOpacity>
      </View>

      {report.photo ? <Image source={{ uri: report.photo }} style={styles.image} /> : null}

      <Text style={styles.title}>{report.fullName}</Text>
      <Text style={styles.sub}>{report.age} • {report.gender} • {report.type}</Text>

      <Text style={styles.section}>Last Seen</Text>
      <Text style={styles.text}>{report.lastSeenDate}</Text>
      <Text style={styles.text}>{report.lastSeenLocation}</Text>

      <Text style={styles.section}>Description</Text>
      <Text style={styles.text}>{report.description || "N/A"}</Text>

      <Text style={styles.section}>Contact</Text>
      <Text style={styles.text}>Name: {report.contactName || "N/A"}</Text>
      <Text style={styles.text}>Phone: {report.contactNumber || "N/A"}</Text>

      <Text style={styles.small}>Reported: {new Date(report.createdAt).toLocaleString()}</Text>

     
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
});
