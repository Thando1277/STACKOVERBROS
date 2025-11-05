import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../Firebase/firebaseConfig';
import { Ionicons } from "@expo/vector-icons";

const HEADER_HEIGHT = 60;

const ChatScreen = ({ navigation }) => {
  const route = useRoute();
  const currentUser = getAuth().currentUser;
  const reportId = route.params?.reportId;

  const [chatUser, setChatUser] = useState(route.params?.user);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [reportData, setReportData] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    if (route.params?.user) {
      const user = route.params.user;
      
      if (user.id === currentUser.uid) {
        Alert.alert(
          "Cannot Message Yourself",
          "You cannot send messages to yourself on your own post.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      setChatUser(user);
    }
  }, [route.params?.user]);

  useEffect(() => {
    if (reportId) {
      const fetchReportData = async () => {
        try {
          const reportDoc = await getDoc(doc(db, 'reports', reportId));
          if (reportDoc.exists()) {
            setReportData(reportDoc.data());
          }
        } catch (error) {
          console.error("Error fetching report data:", error);
        }
      };
      fetchReportData();
    }
  }, [reportId]);

  if (!chatUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chatId =
    currentUser.uid > chatUser.id
      ? `${currentUser.uid}_${chatUser.id}`
      : `${chatUser.id}_${currentUser.uid}`;

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [chatUser.id, chatId]);

  useEffect(() => {
    const markChatAsRead = async () => {
      try {
        const ref = doc(db, 'inbox', currentUser.uid, 'chats', chatUser.id);
        await updateDoc(ref, { isRead: true });
      } catch (error) {
        console.log("Error marking chat as read:", error);
      }
    };
    markChatAsRead();
  }, [chatUser.id, currentUser.uid]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const senderDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let senderName = 'Unknown User';
      let senderAvatar = null;

      if (senderDoc.exists()) {
        const senderData = senderDoc.data();
        senderName = senderData.fullname || 'Unknown User';
        senderAvatar = senderData.avatar || null;
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: currentUser.uid,
        receiverId: chatUser.id,
        createdAt: serverTimestamp(),
        reportId: reportId || null
      });

      await setDoc(
        doc(db, 'inbox', currentUser.uid, 'chats', chatUser.id),
        {
          fullName: chatUser.fullname || 'Unknown',
          avatar: chatUser.avatar || '',
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          isRead: true,
        },
        { merge: true }
      );

      await setDoc(
        doc(db, 'inbox', chatUser.id, 'chats', currentUser.uid),
        {
          fullName: senderName,
          avatar: senderAvatar || '',
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          isRead: false,
        },
        { merge: true }
      );

      setText('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          <View style={styles.headerWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            {chatUser.avatar ? (
              <Image source={{ uri: chatUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
            <Text style={styles.header}>{chatUser.fullname || 'Unknown User'}</Text>
          </View>

          {reportData && (
            <View style={styles.reportContext}>
              <View style={styles.reportContextHeader}>
                <Ionicons name="document-text" size={16} color="#7CC242" />
                <Text style={styles.reportContextText}>
                  Report: {reportData.fullName} ({reportData.type})
                </Text>
              </View>
              <Text style={styles.reportContextSub}>
                {reportData.lastSeenLocation}
              </Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.senderId === currentUser.uid
                    ? styles.sent
                    : styles.received,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  item.senderId === currentUser.uid 
                    ? styles.sentText 
                    : styles.receivedText
                ]}>
                  {item.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  item.senderId === currentUser.uid ? styles.sentTime : styles.receivedTime
                ]}>
                  {item.createdAt?.toDate ? 
                    item.createdAt.toDate().toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 
                    'Sending...'
                  }
                </Text>
              </View>
            )}
            contentContainerStyle={{
              paddingBottom: 10,
              paddingTop: HEADER_HEIGHT + (reportData ? 70 : 10),
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          />

          {typing && (
            <View style={styles.typingContainer}>
              <Text style={styles.typing}>You're typing...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendBtn,
                { backgroundColor: text.trim() ? '#7CC242' : '#ccc' }
              ]}
              onPress={sendMessage}
              disabled={!text.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8F9FB' 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 10 
  },

  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 10,
    height: HEADER_HEIGHT,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { 
    fontWeight: 'bold', 
    fontSize: 18,
    flex: 1,
    color: '#222',
  },

  reportContext: {
    backgroundColor: '#f0f8ff',
    marginHorizontal: 10,
    marginTop: HEADER_HEIGHT + 5,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7CC242',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  reportContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  reportContextText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  reportContextSub: {
    fontSize: 10,
    color: '#666',
    marginLeft: 22,
  },

  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 3,
    maxWidth: '75%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sent: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#7CC242',
    borderBottomRightRadius: 4,
  },
  received: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#222',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  sentTime: {
    alignSelf: 'flex-end',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedTime: {
    alignSelf: 'flex-end',
    color: '#999',
  },

  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typing: { 
    fontStyle: 'italic', 
    color: '#7CC242', 
    fontSize: 13,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fb',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
