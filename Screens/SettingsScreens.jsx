import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Icon name="chevron-left" size={28} color="#000" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile */}
        <View style={styles.profileSection}>
          <Image
            source={require('../assets/FINDSOS-LOGO2.png')} // add your placeholder image
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>Alice Smith</Text>
            <Text style={styles.bio}>Bio</Text>
          </View>
        </View>

        {/* Follow Up */}
        <SectionTitle text="Follow Up" />
        <SettingsItem icon="comment-text-outline" label="Feedback, Hints….." />

        {/* Notifications */}
        <SectionTitle text="Notifications" />
        <SettingsItem icon="bell-outline" label="Toggle, notifi…." />

        {/* Help & Support */}
        <SectionTitle text="Help & Support" />
        <SettingsItem icon="help-circle-outline" label="FAQ/Help Center" />
        <SettingsItem icon="phone-outline" label="Contact Support" onPress={() => navigation.navigate('ContactUs')}/>
        <SettingsItem icon="lock-outline" label="Terms of service and Privacy Policy" onPress={() => navigation.navigate('TermsPrivacyScreen')} />

        {/* Account & Profile Management */}
        <SectionTitle text="Account & Profile Management" />
        <SettingsItem icon="account-circle-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <SettingsItem icon="logout" label="Sign Out" />
      </ScrollView>
    </View>
  );
}

/** ----- Small reusable components ----- */
const SectionTitle = ({ text }) => (
  <Text style={styles.sectionTitle}>{text}</Text>
);

const SettingsItem = ({ icon, label }) => (
  <TouchableOpacity style={styles.item} onPress>
    <Icon name={icon} size={22} color="#000" style={styles.itemIcon} />
    <Text style={styles.itemLabel}>{label}</Text>
  </TouchableOpacity>
);

/** ----- Styles ----- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d9d9d9', // light gray background like your screenshot
    paddingTop: 50,
  },
  scroll: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 6,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  itemIcon: {
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 16,
    flexShrink: 1,
  },
});
