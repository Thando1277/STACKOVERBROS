import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
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
} from 'firebase/firestore';
import { db, auth } from '../Firebase/firebaseConfig';

export default function FeedbackHintsScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch user's posts and listen for notifications
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch user's posts
    const fetchPosts = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        // Sort posts manually by timestamp (newest first)
        const userPosts = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime; // Descending order (newest first)
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
      (snapshot) => {
        const notifMap = {};
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
        });
        
        setNotifications(notifMap);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Navigate to CommentsScreen with reportId parameter
  const handleCommentsPress = (reportId) => {
    console.log('📱 Navigating to Comments with reportId:', reportId);
    navigation.navigate('Comments', { reportId });
  };

  // Navigate to Details screen
  const handleViewReport = (reportId) => {
    console.log('📱 Navigating to Details with reportId:', reportId);
    navigation.navigate('Details', { reportId });
  };

  const renderPost = ({ item }) => {
    const unreadCount = notifications[item.id]?.count || 0;
    const latestCommenter = notifications[item.id]?.latestCommenter;

    return (
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
      </View>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#7CC242" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Feedback & Comments</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#555" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Create a report to receive comments and feedback
            </Text>
          </View>
        }
      />
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
});