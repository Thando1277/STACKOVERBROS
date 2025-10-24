import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();

  const colors = {
    background: isDark ? '#121212' : '#fff',
    card: isDark ? '#1e1e1e' : '#f5f5f5',
    text: isDark ? '#fff' : '#222',
    textSecondary: isDark ? '#aaa' : '#555',
    border: isDark ? '#333' : '#ccc',
    accent: '#7CC242',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <Image source={require('../assets/FINDSOS-LOGO2.png')} style={styles.avatar} />
        </View>

        {/* Theme Toggle */}
        <SectionTitle text="Appearance" color={colors.accent} />
        <TouchableOpacity style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={toggleTheme}>
          <Icon name={isDark ? "weather-sunny" : "weather-night"} size={22} color={colors.accent} style={styles.itemIcon} />
          <Text style={[styles.itemLabel, { color: colors.text }]}>
            {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Text>
        </TouchableOpacity>

        {/* Follow Up */}
        <SectionTitle text="Follow Up" color={colors.accent} />
        <SettingsItem icon="comment-text-outline" label="Feedback, Hints….." colors={colors} />

        {/* Notifications */}
        <SectionTitle text="Notifications" color={colors.accent} />
        <SettingsItem icon="bell-outline" label="Toggle, notifi…." colors={colors} />

        {/* Help & Support */}
        <SectionTitle text="Help & Support" color={colors.accent} />
        <SettingsItem icon="help-circle-outline" label="FAQ/Help Center" onPress={() => navigation.navigate('FAQScreen')} colors={colors} />
        <SettingsItem icon="phone-outline" label="Contact Support" onPress={() => navigation.navigate('ContactUs')} colors={colors} />
        <SettingsItem icon="lock-outline" label="Terms of service and Privacy Policy" onPress={() => navigation.navigate('TermsPrivacyScreen')} colors={colors} />

        {/* Account & Profile Management */}
        <SectionTitle text="Account & Profile Management" color={colors.accent} />
        <SettingsItem icon="account-circle-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} colors={colors} />
        <SettingsItem icon="logout" label="Sign Out" colors={colors} />
      </ScrollView>
    </View>
  );
}

const SectionTitle = ({ text, color }) => <Text style={[styles.sectionTitle, { color }]}>{text}</Text>;
const SettingsItem = ({ icon, label, onPress, colors }) => (
  <TouchableOpacity style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
    <Icon name={icon} size={22} color={colors.accent} style={styles.itemIcon} />
    <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  profileSection: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 15, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1 },
  itemIcon: { marginRight: 10 },
  itemLabel: { fontSize: 16, flexShrink: 1 },
});
