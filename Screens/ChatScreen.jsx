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

const ChatScreen = () => {
  const route = useRoute();
  const { user } = route.params; // the user you are chatting with
  const currentUser = getAuth().currentUser;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  const flatListRef = useRef();

  // ---------- Listen to messages ----------
  useEffect(() => {
    const chatId =
      currentUser.uid > user.id
        ? `${currentUser.uid}_${user.id}`
        : `${user.id}_${currentUser.uid}`;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [user.id]);

  // ---------- Send message ----------
  const sendMessage = async () => {
    if (!text.trim()) return;

    const chatId =
      currentUser.uid > user.id
        ? `${currentUser.uid}_${user.id}`
        : `${user.id}_${currentUser.uid}`;

    // 1️⃣ Add message to messages subcollection
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId: currentUser.uid,
      receiverId: user.id,
      createdAt: serverTimestamp(),
    });

    // 2️⃣ Update inbox for current user
    await setDoc(
      doc(db, 'inbox', currentUser.uid, 'chats', user.id),
      {
        fullName: user.fullname,
        avatar: user.avatar,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3️⃣ Update inbox for receiver
    await setDoc(
      doc(db, 'inbox', user.id, 'chats', currentUser.uid),
      {
        fullName: currentUser.displayName || 'User',
        avatar: currentUser.photoURL || null,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    setText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.header}>{user.fullname}</Text>

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
            contentContainerStyle={{ paddingBottom: 10 }}
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
  container: { flex: 1, padding: 10 },
  header: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
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
