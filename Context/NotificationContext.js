import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../Firebase/irebaseConfig';

const { width } = Dimensions.get('window');

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children, navigation }) => {
  const [notification, setNotification] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [sound, setSound] = useState();

  // Load notification sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          // You can use a local sound file or a system sound
          require('../assets/notification.mp3') // Add a notification sound to your assets
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

  // Listen for new messages
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'inbox', auth.currentUser.uid, 'chats'),
      orderBy('lastMessageAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          
          // Only show notification if message is unread and not from current user
          if (!data.isRead && data.lastMessage) {
            showNotification({
              senderName: data.fullname,
              message: data.lastMessage,
              senderId: change.doc.id,
              avatar: data.avatar
            });
          }
        }
      });
    });

    return unsubscribe;
  }, []);

  const showNotification = async (notificationData) => {
    // Play sound
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.log('Error playing sound:', error);
      }
    }

    // Show notification popup
    setNotification(notificationData);
    
    // Animate in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
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

  const handleNotificationPress = () => {
    if (notification && navigation) {
      // Navigate to chat with the sender
      navigation.navigate('ChatScreen', {
        user: {
          id: notification.senderId,
          fullname: notification.senderName,
          avatar: notification.avatar
        }
      });
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Notification Popup */}
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
              
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={hideNotification}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

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
    padding: 12,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7CC242',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
