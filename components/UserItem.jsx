import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';

const UserItem = ({ name, lastMessage, profilePic, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Avatar */}
      <Image
        source={
          profilePic
            ? { uri: profilePic }
            : require('../assets/FINDSOS-LOGO2.png') // make sure to add this asset
        }
        style={styles.avatar}
      />

      {/* Text info */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage || 'Tap to start chatting'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default UserItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#777',
  },
});
