import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export default function ChatIcon() {
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const inboxRef = collection(db, "inbox", auth.currentUser.uid, "chats");

    const unsubscribe = onSnapshot(inboxRef, (snapshot) => {
      let count = 0;

      snapshot.docs.forEach((docSnap) => {
        const chatData = docSnap.data();

        // Only count unread messages
        if (
          chatData.lastMessageAt &&
          (!chatData.lastMessageSeenAt ||
            chatData.lastMessageAt.toMillis() > chatData.lastMessageSeenAt.toMillis())
        ) {
          count += 1;
        }
      });

      setUnreadCount(count);
    });

    return unsubscribe;
  }, [auth.currentUser]);

  return (
    <View style={{ marginLeft: 10 }}>
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={26}
        style={{color: '#02c048ff'}}
        onPress={() => navigation.navigate("InboxScreen")}
      />

      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            right: -6,
            top: -4,
            backgroundColor: "red",
            borderRadius: 10,
            width: 18,
            height: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}
