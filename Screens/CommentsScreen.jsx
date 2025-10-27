import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
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
} from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";

export default function CommentsScreen({ route }) {
  const navigation = useNavigation();
  const { reportId } = route.params || { reportId: "default" };

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("Anonymous");
  const flatListRef = useRef(null);

  // Fetch current user's name from Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        console.log('🔍 Fetching user name...');
        const userId = auth.currentUser?.uid;
        console.log('👤 Current User ID:', userId);
        
        if (!userId) {
          console.log('❌ No user is logged in!');
          setCurrentUserName("Anonymous");
          return;
        }
        
        const userDocRef = doc(db, "users", userId);
        console.log('📄 Fetching from path: users/' + userId);
        
        const userDoc = await getDoc(userDocRef);
        console.log('📄 Document exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ User data retrieved:', userData);
          console.log('📝 Fullname field:', userData.fullname);
          
          if (userData.fullname) {
            setCurrentUserName(userData.fullname);
            console.log('✅ Set current user name to:', userData.fullname);
          } else {
            console.log('⚠️ Fullname field is empty or undefined');
            setCurrentUserName("Anonymous");
          }
        } else {
          console.log('❌ No document found in Firestore for this user!');
          console.log('⚠️ This means the user signed up before the fix was implemented');
          setCurrentUserName("Anonymous");
        }
      } catch (error) {
        console.error('❌ Error fetching user name:', error);
        console.error('Error details:', error.message);
        setCurrentUserName("Anonymous");
      }
    };
    
    fetchUserName();
  }, []);

  // Fetch comments from Firebase in real-time
  useEffect(() => {
    const commentsRef = collection(db, "reports", reportId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        replies: doc.data().replies || [],
      }));
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [reportId]);

  // ➕ Add Comment or Reply
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to comment.");
      return;
    }

    console.log('💬 Adding comment with username:', currentUserName);

    try {
      if (replyToId) {
        // Add reply to a specific comment
        const commentRef = doc(db, "reports", reportId, "comments", replyToId);
        const newReply = {
          id: Date.now().toString(),
          userId: userId,
          fullname: currentUserName,
          text: commentText,
          createdAt: new Date().toISOString(),
        };

        console.log('💬 Adding reply:', newReply);
        await updateDoc(commentRef, {
          replies: arrayUnion(newReply),
        });
        console.log('✅ Reply added successfully');
      } else {
        // Add top-level comment
        const commentsRef = collection(db, "reports", reportId, "comments");
        const newComment = {
          userId: userId,
          fullname: currentUserName,
          text: commentText,
          createdAt: serverTimestamp(),
          replies: [],
        };

        console.log('💬 Adding comment:', newComment);
        await addDoc(commentsRef, newComment);
        console.log('✅ Comment added successfully');
      }

      setCommentText("");
      setReplyToId(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  // 💬 Reply
  const handleReply = (commentId, fullname) => {
    setReplyToId(commentId);
    setCommentText(`@${fullname} `);
  };

  // 🗑️ Long press to delete
  const handleLongPress = (comment, isReply = false, parentCommentId = null) => {
    // Only allow deletion if user owns the comment
    if (comment.userId !== auth.currentUser?.uid) {
      alert("You can only delete your own comments.");
      return;
    }
    setSelectedComment({ ...comment, isReply, parentCommentId });
    setShowConfirm(true);
  };

  // ✅ Confirm Delete
  const confirmDelete = async () => {
    try {
      if (selectedComment.isReply) {
        // Delete reply
        const commentRef = doc(
          db, 
          "reports", 
          reportId, 
          "comments", 
          selectedComment.parentCommentId
        );
        await updateDoc(commentRef, {
          replies: arrayRemove({
            id: selectedComment.id,
            userId: selectedComment.userId,
            fullname: selectedComment.fullname,
            text: selectedComment.text,
            createdAt: selectedComment.createdAt,
          }),
        });
      } else {
        // Delete main comment
        const commentRef = doc(
          db, 
          "reports", 
          reportId, 
          "comments", 
          selectedComment.id
        );
        await deleteDoc(commentRef);
      }

      setShowConfirm(false);
      setSelectedComment(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7CC242" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Loading comments...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

            {/* Debug display of current username */}
            <Text style={{ color: '#7CC242', textAlign: 'center', fontSize: 12, marginBottom: 5 }}>
              Logged in as: {currentUserName}
            </Text>

            <FlatList
              ref={flatListRef}
              style={{ flex: 1, marginVertical: 10 }}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onLongPress={() => handleLongPress(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.commentCard,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#1a1919ff" : "#343131ff",
                      },
                    ]}
                  >
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentText}>
                        <Text style={{ color: "#7CC242", fontWeight: "bold" }}>
                          @{item.fullname}:{" "}
                        </Text>
                        {item.text}
                      </Text>
                      {item.userId === auth.currentUser?.uid && (
                        <Ionicons name="trash-outline" size={16} color="#ff4d4d" style={{ marginLeft: 8 }} />
                      )}
                    </View>
                    <Text style={styles.commentTime}>
                      {item.createdAt?.seconds 
                        ? new Date(item.createdAt.toDate()).toLocaleString()
                        : new Date(item.createdAt).toLocaleString()
                      }
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
                        onLongPress={() => handleLongPress(rep, true, item.id)}
                        activeOpacity={0.7}
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
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentText}>
                              <Text style={{ color: "#7CC242", fontWeight: "bold" }}>
                                @{rep.fullname}:{" "}
                              </Text>
                              {rep.text}
                            </Text>
                            {rep.userId === auth.currentUser?.uid && (
                              <Ionicons name="trash-outline" size={14} color="#ff4d4d" style={{ marginLeft: 8 }} />
                            )}
                          </View>
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
                  No comments yet. Be the first to comment!
                </Text>
              }
            />

            {/* Input section */}
            <View style={styles.inputContainer}>
              {replyToId && (
                <View style={styles.replyingTo}>
                  <Text style={styles.replyingToText}>Replying to comment...</Text>
                  <TouchableOpacity onPress={() => {
                    setReplyToId(null);
                    setCommentText("");
                  }}>
                    <Ionicons name="close-circle" size={20} color="#7CC242" />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                placeholder="Type your comment..."
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
                style={styles.input}
                multiline
              />
              <TouchableOpacity 
                style={[styles.addBtn, !commentText.trim() && styles.addBtnDisabled]} 
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
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
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  replyCard: {
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
    marginLeft: 15,
  },
  commentText: { fontSize: 14, color: "#fff", flex: 1 },
  commentTime: { fontSize: 12, color: "#ccc", marginTop: 4 },
  replyBtn: {
    color: "#7CC242",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  inputContainer: { marginBottom: 20 },
  replyingTo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyingToText: {
    color: "#7CC242",
    fontSize: 13,
    fontStyle: "italic",
  },
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
  addBtnDisabled: {
    backgroundColor: "#4a6b2e",
    opacity: 0.6,
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