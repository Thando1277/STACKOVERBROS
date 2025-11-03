import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Dimensions, 
  Text, 
  Animated, 
  Image,
  StyleSheet 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./Firebase/firebaseConfig";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { collection, query, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore';
import { Audio } from 'expo-av';

// Screens
import HomeScreen from "./Screens/HomeScreen.jsx";
import ReportScreen from "./Screens/ReportScreen.jsx";
import DetailsScreen from "./Screens/DetailsScreen.jsx";
import ChatbotScreen from "./Screens/ChatbotScreen.jsx";
import LogIn from "./Screens/LogIn.jsx";
import ProfilePage from "./Screens/ProfilePage.jsx";
import CommentsScreen from "./Screens/CommentsScreen.jsx";
import ResetPasswordScreen from "./Screens/ResetPasswordScreen.jsx";
import SettingsScreen from "./Screens/SettingsScreens.jsx";
import FAQScreen from "./Screens/FAQScreen.jsx";
import ContactUs from "./Screens/ContactUs.jsx";
import TermsPrivacyScreen from "./Screens/TermsPrivacyScreen.jsx";
import EditProfile from "./Screens/EditProfile.jsx";
import InboxScreen from "./Screens/InboxScreen.jsx";
import ChatScreen from "./Screens/ChatScreen.jsx";
import DraggableIcon from "./Screens/DragChat.jsx";
import FeedbackHints from "./Screens/FeedbackHints.jsx";

// Map & Safety Screens
import MapScreen from "./Screens/MapScreen.jsx";
import Panic from "./Screens/Panic.jsx";
import Alerts from "./Screens/Alerts.jsx";
import NotificationDetails from "./Screens/NotificationDetails.jsx";

// Offline Reports Screen
import OfflineReportsScreen from "./Screens/OfflineReportsScreen.jsx";

const Stack = createNativeStackNavigator();
const { width, height } = Dimensions.get("window");

// Notification Context
const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

// Notification Provider Component
const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [sound, setSound] = useState();
  const lastMessageRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }
        );
        setSound(sound);
      } catch (error) {
        console.log('Error loading sound:', error);
      }
    };
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'inbox', auth.currentUser.uid, 'chats'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const docChanges = snapshot.docChanges();
      
      for (const change of docChanges) {
        if (change.type === 'added' || change.type === 'modified') {
          const chatData = change.doc.data();
          const senderId = change.doc.id;
          
          if (!chatData.isRead && 
              chatData.lastMessage && 
              senderId !== auth.currentUser.uid &&
              lastMessageRef.current !== `${senderId}_${chatData.lastMessage}_${chatData.lastMessageAt?.seconds}`) {
            
            lastMessageRef.current = `${senderId}_${chatData.lastMessage}_${chatData.lastMessageAt?.seconds}`;
            
            const userDoc = await getDoc(doc(db, 'users', senderId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            const senderName = userData.fullname || chatData.fullname || 'Unknown';
            const senderAvatar = userData.avatar || '';
            
            showNotification({
              senderName: senderName,
              message: chatData.lastMessage,
              senderId: senderId,
              avatar: senderAvatar
            });
          }
        }
      }
    });

    return unsubscribe;
  }, []);

  const showNotification = async (notificationData) => {
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.log('Error playing sound:', error);
      }
    }

    setNotification(notificationData);
    
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setNotification(null);
    });
  };

  const handleNotificationPress = async () => {
    if (notification && navigation) {
      const userDoc = await getDoc(doc(db, 'users', notification.senderId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      navigation.navigate('ChatScreen', {
        user: {
          id: notification.senderId,
          fullname: userData.fullname || notification.senderName,
          avatar: userData.avatar || notification.avatar,
        }
      });
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {notification && (
        <Animated.View 
          style={[
            styles.notificationContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.notification}
            onPress={handleNotificationPress}
            activeOpacity={0.9}
          >
            <View style={styles.notificationContent}>
              {notification.avatar ? (
                <Image 
                  source={{ uri: notification.avatar }} 
                  style={styles.notificationAvatar} 
                />
              ) : (
                <View style={[styles.notificationAvatar, styles.defaultAvatar]}>
                  <Ionicons name="person" size={20} color="#666" />
                </View>
              )}
              
              <View style={styles.notificationText}>
                <Text style={styles.senderName} numberOfLines={1}>
                  {notification.senderName}
                </Text>
                <Text style={styles.messagePreview} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>
              
              <View style={styles.notificationIcon}>
                <Ionicons name="chatbubble" size={16} color="#7CC242" />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={hideNotification}
          >
            <Ionicons name="close" size={14} color="#666" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0FC436" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NotificationProvider>
        <Stack.Navigator initialRouteName={user ? "Home" : "LogIn"} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LogIn" component={LogIn} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
          <Stack.Screen name="Comments" component={CommentsScreen} />
          <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
          <Stack.Screen name="InboxScreen" component={InboxScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          <Stack.Screen name="FAQScreen" component={FAQScreen} />
          <Stack.Screen name="ContactUs" component={ContactUs} />
          <Stack.Screen name="TermsPrivacyScreen" component={TermsPrivacyScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="FeedbackHints" component={FeedbackHints} />
          <Stack.Screen name="MapScreen" component={MapScreen} />
          <Stack.Screen name="Panic" component={Panic} />
          <Stack.Screen name="Alerts" component={Alerts} />
          <Stack.Screen name="NotificationDetails" component={NotificationDetails} />
          <Stack.Screen name="OfflineReports" component={OfflineReportsScreen} />
        </Stack.Navigator>
      </NotificationProvider>

      <DraggableIcon
        startX={width - 70} 
        startY={height - 150} 
        onPress={() => setChatVisible(true)}
      >
        <View style={styles.floatingChatButton}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </View>
      </DraggableIcon>

      <Modal visible={chatVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <ChatbotScreen />
          <TouchableOpacity
            style={styles.chatbotCloseButton}
            onPress={() => setChatVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 9999,
    elevation: 10,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7CC242',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  notificationIcon: {
    marginLeft: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  floatingChatButton: {
    backgroundColor: "#65a730ff",
    padding: 16,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#fff",
  },
  chatbotCloseButton: {
    position: "absolute", 
    top: 40, 
    right: 20, 
    backgroundColor: "#222", 
    padding: 10, 
    borderRadius: 20
  },
});
