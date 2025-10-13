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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#7CC242" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile */}
        <View style={styles.profileSection}>
          <Image
            source={require('../assets/FINDSOS-LOGO2.png')} // placeholder image
            style={styles.avatar}
          />
          {/* Removed static name and bio */}
        </View>

        {/* Follow Up */}
        <SectionTitle text="Follow Up" />
        <SettingsItem icon="comment-text-outline" label="Feedback, Hints….." />

        {/* Notifications */}
        <SectionTitle text="Notifications" />
        <SettingsItem icon="bell-outline" label="Toggle, notifi…." />

        {/* Help & Support */}
        <SectionTitle text="Help & Support" />
        <SettingsItem
          icon="help-circle-outline"
          label="FAQ/Help Center"
          onPress={() => navigation.navigate('FAQScreen')}
        />
        <SettingsItem
          icon="phone-outline"
          label="Contact Support"
          onPress={() => navigation.navigate('ContactUs')}
        />
        <SettingsItem
          icon="lock-outline"
          label="Terms of service and Privacy Policy"
          onPress={() => navigation.navigate('TermsPrivacyScreen')}
        />

        {/* Account & Profile Management */}
        <SectionTitle text="Account & Profile Management" />
        <SettingsItem
          icon="account-circle-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingsItem icon="logout" label="Sign Out" />
      </ScrollView>
    </View>
  );
}

/** ----- Small reusable components ----- */
const SectionTitle = ({ text }) => (
  <Text style={styles.sectionTitle}>{text}</Text>
);

const SettingsItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Icon name={icon} size={22} color="#7CC242" style={styles.itemIcon} />
    <Text style={styles.itemLabel}>{label}</Text>
  </TouchableOpacity>
);

/** ----- Styles ----- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    color: 'white',
  },
  profileSection: {
    backgroundColor: '#1e1e1e',
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
    backgroundColor: '#333',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 6,
    color: '#7CC242',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemIcon: {
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 16,
    flexShrink: 1,
    color: '#fff',
  },
});
