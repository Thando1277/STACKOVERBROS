import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext";

export default function CommentsScreen({ route }) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { reportId } = route.params || { reportId: "default" };

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Anonymous");
  const [reportOwnerId, setReportOwnerId] = useState(null);
  const flatListRef = useRef(null);

  // Theme colors
  const themeColors = {
    background: isDark ? '#0D0D0D' : '#F5F5F7',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subText: isDark ? '#888' : '#666',
    card: isDark ? '#1A1A1A' : '#FFFFFF',
    cardAlt: isDark ? '#262626' : '#F0F0F0',
    replyCard: isDark ? '#262626' : '#E8E8E8',
    replyCardAlt: isDark ? '#333333' : '#DADADA',
    modalBg: isDark ? '#1A1A1A' : '#FFFFFF',
    inputBg: isDark ? '#262626' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  // Fetch current user's name
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setCurrentUserName(userDoc.data().fullname || "Anonymous");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };
    fetchUserName();
  }, []);

  // Fetch report owner ID
  useEffect(() => {
    const fetchReportOwner = async () => {
      try {
        const reportDoc = await getDoc(doc(db, "reports", reportId));
        if (reportDoc.exists()) {
          setReportOwnerId(reportDoc.data().userId);
        }
      } catch (error) {
        console.error("Error fetching report owner:", error);
      }
    };
    fetchReportOwner();
  }, [reportId]);

  // Mark notifications as read
  useEffect(() => {
    const markAsRead = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          where("reportId", "==", reportId),
          where("read", "==", false)
        );

        const snapshot = await getDocs(q);
        const updates = snapshot.docs.map((d) =>
          updateDoc(doc(db, "notifications", d.id), { read: true })
        );
        await Promise.all(updates);
      } catch (error) {
        console.error("Error marking notifications:", error);
      }
    };
    markAsRead();
  }, [reportId]);

  // Fetch comments in real-time
  useEffect(() => {
    const q = query(
      collection(db, "reports", reportId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          replies: d.data().replies || [],
        }));
        setComments(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [reportId]);

  // Create notification
  const createNotification = async (type) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!reportOwnerId || userId === reportOwnerId) return;

      await addDoc(collection(db, "notifications"), {
        userId: reportOwnerId,
        reportId,
        commenterName: currentUserName,
        commenterId: userId,
        type,
        message: `${currentUserName} commented on your post`,
        createdAt: serverTimestamp(),
        read: false,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Add comment or reply
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("Please log in to comment.");
      return;
    }

    try {
      if (replyToId) {
        const commentRef = doc(db, "reports", reportId, "comments", replyToId);
        const reply = {
          id: Date.now().toString(),
          userId,
          fullname: currentUserName,
          text: commentText,
          createdAt: new Date().toISOString(),
        };
        await updateDoc(commentRef, { replies: arrayUnion(reply) });
        await createNotification("reply");
      } else {
        await addDoc(collection(db, "reports", reportId, "comments"), {
          userId,
          fullname: currentUserName,
          text: commentText,
          createdAt: serverTimestamp(),
          replies: [],
        });
        await createNotification("comment");
      }

      setCommentText("");
      setReplyToId(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    }
  };

  // Handle reply
  const handleReply = (id, name) => {
    setReplyToId(id);
    setCommentText(`@${name} `);
  };

  // Long press delete
  const handleLongPress = (comment, isReply = false, parentId = null) => {
    if (comment.userId !== auth.currentUser?.uid) {
      alert("You can only delete your own comments.");
      return;
    }
    setSelectedComment({ ...comment, isReply, parentId });
    setShowConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      if (selectedComment.isReply) {
        const ref = doc(db, "reports", reportId, "comments", selectedComment.parentId);
        await updateDoc(ref, { replies: arrayRemove(selectedComment) });
      } else {
        await deleteDoc(doc(db, "reports", reportId, "comments", selectedComment.id));
      }
      setShowConfirm(false);
      setSelectedComment(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#7CC242" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#7CC242" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: themeColors.text }]}>Comments</Text>
            <Text style={{ color: "#7CC242", textAlign: "center", marginVertical: 5 }}>
              Logged in as: {currentUserName}
            </Text>

            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.commentCard,
                    { backgroundColor: index % 2 === 0 ? themeColors.card : themeColors.cardAlt },
                  ]}
                >
                  <TouchableOpacity onLongPress={() => handleLongPress(item)}>
                    <Text style={{ color: themeColors.text }}>
                      <Text style={{ color: "#7CC242" }}>@{item.fullname}: </Text>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.commentTime, { color: themeColors.subText }]}>
                    {item.createdAt?.seconds
                      ? new Date(item.createdAt.toDate()).toLocaleString()
                      : new Date(item.createdAt).toLocaleString()}
                  </Text>
                  <TouchableOpacity onPress={() => handleReply(item.id, item.fullname)}>
                    <Text style={styles.replyBtn}>Reply</Text>
                  </TouchableOpacity>

                  {item.replies?.map((rep, idx) => (
                    <TouchableOpacity
                      key={rep.id}
                      onLongPress={() => handleLongPress(rep, true, item.id)}
                    >
                      <View
                        style={[
                          styles.replyCard,
                          { backgroundColor: idx % 2 === 0 ? themeColors.replyCard : themeColors.replyCardAlt },
                        ]}
                      >
                        <Text style={{ color: themeColors.text }}>
                          <Text style={{ color: "#7CC242" }}>@{rep.fullname}: </Text>
                          {rep.text}
                        </Text>
                        <Text style={[styles.commentTime, { color: themeColors.subText }]}>
                          {new Date(rep.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: themeColors.subText, marginTop: 20 }}>
                  No comments yet.
                </Text>
              }
            />

            {/* Input */}
            <View style={styles.inputContainer}>
              {replyToId && (
                <View style={[styles.replyingTo, { backgroundColor: themeColors.cardAlt }]}>
                  <Text style={styles.replyingToText}>Replying...</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setReplyToId(null);
                      setCommentText("");
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#7CC242" />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Type your comment..."
                placeholderTextColor={themeColors.subText}
                style={[
                  styles.input, 
                  { 
                    backgroundColor: themeColors.inputBg, 
                    color: themeColors.text,
                    borderColor: themeColors.border
                  }
                ]}
                multiline
              />
              <TouchableOpacity
                style={[styles.addBtn, !commentText.trim() && styles.addBtnDisabled]}
                disabled={!commentText.trim()}
                onPress={handleAddComment}
              >
                <Text style={styles.addBtnText}>
                  {replyToId ? "Reply" : "Add Comment"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Delete Modal */}
            <Modal transparent visible={showConfirm} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: themeColors.modalBg }]}>
                  <Text style={[styles.modalTitle, { color: "#7CC242" }]}>Delete Comment?</Text>
                  <Text style={[styles.modalMessage, { color: themeColors.subText }]}>
                    Are you sure? This cannot be undone.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { backgroundColor: themeColors.cardAlt }]}
                      onPress={() => setShowConfirm(false)}
                    >
                      <Text style={[styles.cancelText, { color: themeColors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn]}
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
  container: { flex: 1, paddingHorizontal: 20 },
  backBtn: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  backText: { color: "#7CC242", marginLeft: 5, fontSize: 16, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  commentCard: { borderRadius: 12, padding: 10, marginVertical: 5 },
  replyCard: { borderRadius: 10, padding: 8, marginTop: 5, marginLeft: 15 },
  commentTime: { fontSize: 12, marginTop: 4 },
  replyBtn: { color: "#7CC242", fontWeight: "600", marginTop: 4 },
  inputContainer: { marginBottom: 20 },
  replyingTo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyingToText: { color: "#7CC242", fontStyle: "italic" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 50,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: "#7CC242",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnDisabled: { backgroundColor: "#4a6b2e", opacity: 0.6 },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  modalMessage: { marginVertical: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmBtn: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelText: { fontWeight: '600' },
  confirmText: { color: "#fff", fontWeight: '600' },
});
