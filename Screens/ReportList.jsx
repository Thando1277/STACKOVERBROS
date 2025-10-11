import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  StyleSheet,
} from "react-native";
import { useData } from "../DataContext"; // adjust path if your DataContext is in another folder
import { Ionicons } from "@expo/vector-icons"; // Expo provides this by default

export default function ReportList() {
  const { reports, addComment } = useData();

  // Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [commentText, setCommentText] = useState("");

  return (
    <View style={styles.container}>
      {/* Reports list */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title || "No Title"}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Created: {new Date(item.createdAt).toLocaleString()}</Text>

            {/* Show number of comments */}
            <Text style={styles.commentCount}>
              Comments: {item.comments ? item.comments.length : 0}
            </Text>

            {/* Chat icon to open modal */}
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color="blue"
              style={styles.icon}
              onPress={() => setSelectedReport(item)}
            />
          </View>
        )}
      />

      {/* Modal for adding/viewing comments */}
      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {selectedReport?.title || "Report"}
            </Text>

            {/* Existing comments */}
            <Text style={styles.sectionTitle}>Comments:</Text>
            {selectedReport?.comments && selectedReport.comments.length > 0 ? (
              selectedReport.comments.map((c) => (
                <Text key={c.id} style={styles.comment}>
                  • {c.text} ({new Date(c.createdAt).toLocaleString()})
                </Text>
              ))
            ) : (
              <Text>No comments yet</Text>
            )}

            {/* Input for new comment */}
            <TextInput
              placeholder="I might have seen this pet/person..."
              value={commentText}
              onChangeText={setCommentText}
              style={styles.input}
            />

            <Button
              title="Submit Comment"
              onPress={() => {
                if (commentText.trim()) {
                  addComment(selectedReport.id, commentText);
                  setCommentText("");
                  setSelectedReport(null); // close modal
                }
              }}
            />

            <View style={{ marginTop: 10 }}>
              <Button
                title="Close"
                color="red"
                onPress={() => setSelectedReport(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  card: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  commentCount: { marginTop: 5, fontStyle: "italic" },
  icon: { marginTop: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  sectionTitle: { fontWeight: "bold", marginTop: 10, marginBottom: 5 },
  comment: { marginLeft: 5, marginBottom: 3 },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginVertical: 10,
  },
});
