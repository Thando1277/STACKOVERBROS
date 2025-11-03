import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../Firebase/firebaseConfig';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function FeedbackHintsScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [hiddenPosts, setHiddenPosts] = useState([]);

  // Fetch user's posts and listen for notifications
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch hidden posts from user document
    const fetchHiddenPosts = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', userId))
        );
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setHiddenPosts(userData.hiddenReports || []);
        }
      } catch (error) {
        console.error('Error fetching hidden posts:', error);
      }
    };

    fetchHiddenPosts();

    // Fetch user's posts
    const fetchPosts = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        const userPosts = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
          });

        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();

    // Listen for notifications in real-time
    const notificationsRef = collection(db, 'notifications');
    const notifQuery = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      async (snapshot) => {
        const notifMap = {};
        const newlyCommentedPosts = [];

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const reportId = data.reportId;
          
          if (!notifMap[reportId]) {
            notifMap[reportId] = {
              count: 0,
              latestCommenter: '',
            };
          }
          
          notifMap[reportId].count += 1;
          notifMap[reportId].latestCommenter = data.commenterName;

          // Track posts that received new comments
          if (!newlyCommentedPosts.includes(reportId)) {
            newlyCommentedPosts.push(reportId);
          }
        });
        
        setNotifications(notifMap);

        // Unhide posts that received new comments
        if (newlyCommentedPosts.length > 0) {
          try {
            const userDocRef = doc(db, 'users', userId);
            const currentHidden = hiddenPosts.filter(
              id => !newlyCommentedPosts.includes(id)
            );
            
            await updateDoc(userDocRef, {
              hiddenReports: currentHidden
            });
            
            setHiddenPosts(currentHidden);
          } catch (error) {
            console.error('Error unhiding posts:', error);
          }
        }
      },
      (error) => {
        console.error('Error listening to notifications:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle long press to show confirmation modal
  const handleLongPress = (postId) => {
    setSelectedPostId(postId);
    setShowConfirmModal(true);
  };

  // Hide the post
  const confirmHidePost = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedPostId) return;

      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        hiddenReports: arrayUnion(selectedPostId)
      });

      setHiddenPosts(prev => [...prev, selectedPostId]);
      setShowConfirmModal(false);
      setSelectedPostId(null);
    } catch (error) {
      console.error('Error hiding post:', error);
      alert('Failed to hide post. Please try again.');
    }
  };

  // Navigate to CommentsScreen
  const handleCommentsPress = (reportId) => {
    console.log('📱 Navigating to Comments with reportId:', reportId);
    navigation.navigate('Comments', { reportId });
  };

  // Navigate to Details screen
  const handleViewReport = (reportId) => {
    console.log('📱 Navigating to Details with reportId:', reportId);
    navigation.navigate('Details', { reportId });
  };

  // Filter out hidden posts
  const visiblePosts = posts.filter(post => !hiddenPosts.includes(post.id));

  const renderPost = ({ item }) => {
    const unreadCount = notifications[item.id]?.count || 0;
    const latestCommenter = notifications[item.id]?.latestCommenter;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item.id)}
        delayLongPress={800}
      >
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postInfo}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {item.type || 'Report'}: {item.location || 'Location unavailable'}
              </Text>
              <Text style={styles.postDate}>
                {item.timestamp?.seconds
                  ? new Date(item.timestamp.toDate()).toLocaleDateString()
                  : 'Date unavailable'}
              </Text>
            </View>
            
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {unreadCount > 0 && latestCommenter && (
            <View style={styles.notificationInfo}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#7CC242" />
              <Text style={styles.notificationText}>
                {latestCommenter} {unreadCount === 1 ? 'commented' : `and ${unreadCount - 1} other${unreadCount > 2 ? 's' : ''} commented`} on your post
              </Text>
            </View>
          )}

          <View style={styles.postFooter}>
            <TouchableOpacity 
              style={styles.viewReportButton}
              onPress={() => handleViewReport(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.viewReportText}>View Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.viewCommentsButton}
              onPress={() => handleCommentsPress(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#7CC242" />
              <Text style={styles.viewCommentsText}>View Comments</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hintContainer}>
            <Ionicons name="information-circle-outline" size={12} color="#666" />
            <Text style={styles.hintText}>Hold to hide this post</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7CC242" />
          <Text style={styles.loadingText}>Loading your posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={scale(28)} color="#7CC242" />
        </TouchableOpacity>
      </View>
      
      <View style={{ flex: 1,padding: 30, paddingTop: 10 }}>
        <Text style={styles.title}>Feedback & Comments</Text>
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#555" />
            <Text style={styles.emptyText}>
              {hiddenPosts.length > 0 ? 'All posts hidden' : 'No posts yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {hiddenPosts.length > 0 
                ? 'Hidden posts will reappear when someone comments on them'
                : 'Create a report to receive comments and feedback'}
            </Text>
          </View>
        }
      />

      {/* Custom Confirmation Modal */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="eye-off" size={48} color="#7CC242" />
            </View>
            
            <Text style={styles.modalTitle}>Hide This Post?</Text>
            
            <Text style={styles.modalMessage}>
              This post will be hidden from your feed. Don't worry - it will automatically 
              reappear when someone comments on it!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedPostId(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmHidePost}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-off-outline" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Hide Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    color: '#7CC242',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  postCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  postInfo: {
    flex: 1,
    marginRight: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  postDate: {
    fontSize: 12,
    color: '#888',
  },
  notificationBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#7CC242',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
    flex: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 10,
  },
  viewReportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewReportText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewCommentsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262626',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7CC242',
    gap: 6,
  },
  viewCommentsText: {
    color: '#7CC242',
    fontSize: 14,
    fontWeight: '600',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#7CC242',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7CC242',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7CC242',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderBottomWidth: 0.3,
  },
});