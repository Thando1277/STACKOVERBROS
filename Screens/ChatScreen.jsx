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
} from 'firebase/firestore';
import { db } from '../Firebase/firebaseConfig';
import { Ionicons } from "@expo/vector-icons";


const HEADER_HEIGHT = 60; // adjust if needed

const ChatScreen = ({ navigation }) => {
  const route = useRoute();
  const currentUser = getAuth().currentUser;
  const reportId = route.params?.reportId;

  const [chatUser, setChatUser] = useState(route.params?.user);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    if (route.params?.user) {
      setChatUser(route.params.user);
    }
  }, [route.params?.user]);

  if (!chatUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    const chatId =
      currentUser.uid > chatUser.id
        ? `${currentUser.uid}_${chatUser.id}`
        : `${chatUser.id}_${currentUser.uid}`;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [chatUser.id]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const chatId =
      currentUser.uid > chatUser.id
        ? `${currentUser.uid}_${chatUser.id}`
        : `${chatUser.id}_${currentUser.uid}`;

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
        fullName: chatUser.fullname,
        avatar: chatUser.avatar,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'inbox', chatUser.id, 'chats', currentUser.uid),
      {
        fullName: currentUser.displayName || 'User',
        avatar: currentUser.photoURL || null,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    setText('');
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <View style={styles.container}>
          {/* Sticky Header */}
          <View style={styles.headerWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            {chatUser.avatar && (
              <Image source={{ uri: chatUser.avatar }} style={styles.avatar} />
            )}
            <Text style={styles.header}>{chatUser.fullname}</Text>
          </View>

          {/* Messages list */}
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
                <Text>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={{ 
              paddingBottom: 10, 
              paddingTop: HEADER_HEIGHT + 10, // <- ensure first message is visible
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Typing indicator */}
          {typing && <Text style={styles.typing}>You’re typing...</Text>}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={text}
              onChangeText={setText}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
            />
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.sendButton}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { flex: 1, paddingHorizontal: 10 },

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
    height: HEADER_HEIGHT, // same as HEADER_HEIGHT constant
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  header: { fontWeight: 'bold', fontSize: 18 },

  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  sent: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  received: { alignSelf: 'flex-start', backgroundColor: '#FFF' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#fff',
  },
  sendButton: { marginLeft: 10, color: '#007AFF', fontWeight: 'bold' },
  typing: { fontStyle: 'italic', color: 'gray', marginVertical: 4 },
});
