import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useData } from "../context/DataContext";

export default function CommentsScreen({ route }) {
  const { reportId } = route.params;
  const { reports, addComment } = useData();

  const report = reports.find((r) => r.id === reportId);
  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(reportId, commentText.trim());
    setCommentText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>{report.fullName} - Comments</Text>

        <FlatList
          style={{ flex: 1, marginVertical: 10 }}
          data={report.comments || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.commentText}>{item.text}</Text>
              <Text style={styles.commentTime}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              No comments yet.
            </Text>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Type your comment..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.input}
            multiline
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddComment}>
            <Text style={styles.addBtnText}>Add Comment</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 10, textAlign: "center" },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7CC242",
    padding: 10,
    marginVertical: 5,
  },
  commentText: { fontSize: 14, color: "#222" },
  commentTime: { fontSize: 12, color: "gray", marginTop: 4 },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: "#7CC242",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    minHeight: 50,
    textAlignVertical: "top",
  },
  addBtn: {
    backgroundColor: "#7CC242", // Same as View Details button
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
