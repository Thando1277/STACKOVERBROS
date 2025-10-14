import React, { useState, useRef } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function CommentsScreen({ route }) {
  const navigation = useNavigation();
  const { reportId } = route.params || { reportId: "default" };

  const [comments, setComments] = useState([
    {
      id: Date.now().toString(),
      fullname: "Lindo",
      text: "This is a sample comment.",
      createdAt: new Date().toISOString(),
      replies: [],
    },
  ]);

  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const flatListRef = useRef(null);

  // ➕ Add Comment or Reply
  const handleAddComment = () => {
    if (!commentText.trim()) return;

    if (replyToId) {
      // Add reply to a specific comment
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === replyToId
            ? {
                ...comment,
                replies: [
                  ...comment.replies,
                  {
                    id: Date.now().toString(),
                    fullname: "You",
                    text: commentText,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : comment
        )
      );
    } else {
      // Add top-level comment
      const newComment = {
        id: Date.now().toString(),
        fullname: "You",
        text: commentText,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      setComments((prev) => [...prev, newComment]);
    }

    setCommentText("");
    setReplyToId(null);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 💬 Reply
  const handleReply = (commentId, fullname) => {
    setReplyToId(commentId);
    setCommentText(`@${fullname} `);
  };

  // 🗑️ Long press to delete
  const handleLongPress = (comment) => {
    setSelectedComment(comment);
    setShowConfirm(true);
  };

  // ✅ Confirm Delete
  const confirmDelete = () => {
    setComments((prev) =>
      prev
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((rep) => rep.id !== selectedComment.id),
        }))
        .filter((comment) => comment.id !== selectedComment.id)
    );
    setShowConfirm(false);
    setSelectedComment(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#7CC242" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Comments</Text>

            <FlatList
              ref={flatListRef}
              style={{ flex: 1, marginVertical: 10 }}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity onLongPress={() => handleLongPress(item)}>
                  <View
                    style={[
                      styles.commentCard,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#1a1919ff" : "#343131ff",
                      },
                    ]}
                  >
                    <Text style={styles.commentText}>
                      <Text style={{ color: "#7CC242" }}>@{item.fullname}: </Text>
                      {item.text}
                    </Text>
                    <Text style={styles.commentTime}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>

                    {/* Reply button */}
                    <TouchableOpacity
                      onPress={() => handleReply(item.id, item.fullname)}
                    >
                      <Text style={styles.replyBtn}>Reply</Text>
                    </TouchableOpacity>

                    {/* Replies */}
                    {item.replies?.map((rep, idx) => (
                      <TouchableOpacity
                        key={rep.id}
                        onLongPress={() => handleLongPress(rep)}
                      >
                        <View
                          style={[
                            styles.replyCard,
                            {
                              backgroundColor:
                                idx % 2 === 0 ? "#262626" : "#333333",
                            },
                          ]}
                        >
                          <Text style={styles.commentText}>
                            <Text style={{ color: "#7CC242" }}>
                              @{rep.fullname}:{" "}
                            </Text>
                            {rep.text}
                          </Text>
                          <Text style={styles.commentTime}>
                            {new Date(rep.createdAt).toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={{ textAlign: "center", marginTop: 20, color: "#888" }}
                >
                  No comments yet.
                </Text>
              }
            />

            {/* Input section */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Type your comment..."
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
                style={styles.input}
                multiline
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddComment}>
                <Text style={styles.addBtnText}>
                  {replyToId ? "Reply" : "Add Comment"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Delete Confirmation Modal */}
            <Modal
              transparent
              visible={showConfirm}
              animationType="fade"
              onRequestClose={() => setShowConfirm(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Delete Comment?</Text>
                  <Text style={styles.modalMessage}>
                    Are you sure you want to delete this comment? This action
                    cannot be undone.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowConfirm(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={confirmDelete}
                    >
                      <Text style={styles.confirmText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 20 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  backText: { color: "#7CC242", fontSize: 16, fontWeight: "600", marginLeft: 5 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
    color: "#fff",
  },
  commentCard: {
    borderRadius: 12,
    padding: 10,
    marginVertical: 5,
  },
  replyCard: {
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
    marginLeft: 15,
  },
  commentText: { fontSize: 14, color: "#fff" },
  commentTime: { fontSize: 12, color: "#ccc", marginTop: 4 },
  replyBtn: {
    color: "#7CC242",
    fontSize: 13,
    marginTop: 4,
  },
  inputContainer: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#7CC242",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    minHeight: 50,
    textAlignVertical: "top",
    color: "#fff",
    backgroundColor: "#1A1A1A",
  },
  addBtn: {
    backgroundColor: "#7CC242",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7CC242",
    marginBottom: 10,
  },
  modalMessage: { color: "#ccc", fontSize: 14, marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 15 },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#333",
    borderRadius: 6,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#ff4d4d",
    borderRadius: 6,
  },
  cancelText: { color: "#fff", fontWeight: "600" },
  confirmText: { color: "#fff", fontWeight: "600" },
});
