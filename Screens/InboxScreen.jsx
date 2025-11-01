import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../Firebase/firebaseConfig';
import UserItem from '../components/UserItem';

const InboxScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'inbox', currentUser.uid, 'chats'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const chatData = docSnap.data();
          const userId = docSnap.id;

          // Get the user info from 'users' collection
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return {
            id: userId,
            fullName: userData.fullname || chatData.fullName || 'Unknown',
            avatar: userData.avatar || '',
            lastMessage: chatData.lastMessage || '',
            lastMessageAt: chatData.lastMessageAt || null,
            isRead: chatData.isRead ?? true, // 👈 default true if not present
          };
        })
      );

      setUsers(list);
      setFilteredUsers(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Filter users by search input
  useEffect(() => {
    if (!searchText) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.fullName.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, users]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4EAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Inbox</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Chat list */}
      <View style={styles.listContainer}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No results</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserItem
                name={item.fullName}
                profilePic={item.avatar}
                lastMessage={item.lastMessage}
                hasUnreadMessages={!item.isRead} // 👈 Show red dot if not read
                onPress={() =>
                  navigation.navigate('ChatScreen', {
                    user: {
                      id: item.id,
                      fullname: item.fullName,
                      avatar: item.avatar,
                    },
                  })
                }
              />
            )}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        )}
      </View>

      {/* Trademark */}
      <View style={styles.trademarkContainer}>
        <Text style={styles.trademarkText}>FindSOS</Text>
      </View>
    </SafeAreaView>
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 42,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  trademarkContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8F9FB',
  },
  trademarkText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
});
