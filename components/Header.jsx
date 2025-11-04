import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function Header({ 
  navigation, 
  iconColor = '#7CC242', 
  borderColor = '#444',
  onBackPress 
}) {
  const insets = useSafeAreaInsets();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[
      styles.headerRow, 
      { 
        borderBottomColor: borderColor,
        paddingTop: insets.top + scale(10)
      }
    ]}>
      <TouchableOpacity onPress={handleBackPress}>
        <Ionicons name="chevron-back" size={scale(28)} color={iconColor} />
      </TouchableOpacity>
      <View style={{ width: scale(28) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: scale(10),
    borderBottomWidth: 0.3,
  },
});
