import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../Firebase/firebaseConfig";
import { OfflineReportManager } from '../utils/OfflineReportManager';

export default function SettingsScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const [totalUnreadComments, setTotalUnreadComments] = useState(0);
  const [pendingOfflineReports, setPendingOfflineReports] = useState(0);

  const colors = {
    background: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
    accent: '#7CC242',
    accentLight: isDark ? '#8CD252' : '#6BB232',
    shadow: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)',
  };

  // Listen for unread notifications
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    console.log('👀 Listening for all notifications for user:', userId);

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.docs.length;
        console.log('🔔 Total unread notifications:', count);
        setTotalUnreadComments(count);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Check for pending offline reports
  useEffect(() => {
    checkPendingReports();
    
    // Refresh count periodically
    const interval = setInterval(checkPendingReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkPendingReports = async () => {
    const count = await OfflineReportManager.getPendingCount();
    setPendingOfflineReports(count);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <Icon name="chevron-left" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={[
          styles.profileSection, 
          { 
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
          }
        ]}>
          <View style={styles.avatarContainer}>
            <Image source={require('../assets/FINDSOS-LOGO2.png')} style={styles.avatar} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Settings & Preferences</Text>
            <Text style={[styles.profileSubtext, { color: colors.textSecondary }]}>
              Customize your experience
            </Text>
          </View>
        </View>

        {/* Appearance Section */}
        <SectionTitle text="Appearance" color={colors.textSecondary} />
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#2A3F1F' : '#F0F7E8' }]}>
              <Icon name={isDark ? "weather-night" : "weather-sunny"} size={20} color={colors.accent} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.itemSubtext, { color: colors.textSecondary }]}>
                {isDark ? "Dark mode" : "Light mode"}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 📱 Offline Reports & Follow Up Section */}
        <SectionTitle text="Follow Up" color={colors.textSecondary} />
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <SettingsItemPro 
            icon="cloud-sync-outline" 
            iconBg={isDark ? '#1F2A3F' : '#E8F0F7'}
            label="Offline Reports"    
            subtext={`${pendingOfflineReports} pending report${pendingOfflineReports !== 1 ? 's' : ''} to sync`}
            onPress={() => navigation.navigate('OfflineReports')}  
            colors={colors}
            badgeCount={pendingOfflineReports}
            showDivider
          />
          <SettingsItemPro 
            icon="comment-text-outline" 
            iconBg={isDark ? '#2A3F1F' : '#F0F7E8'}
            label="Feedback & Hints"    
            subtext="View comments and suggestions"
            onPress={() => navigation.navigate('FeedbackHints')}  
            colors={colors}
            badgeCount={totalUnreadComments}
          />
        </View>

        {/* Notifications Section */}
        <SectionTitle text="Notifications" color={colors.textSecondary} />
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <SettingsItemPro 
            icon="bell-outline" 
            iconBg={isDark ? '#2A3F1F' : '#F0F7E8'}
            label="Notification Settings" 
            subtext="Manage your alerts"
            colors={colors} 
          />
        </View>

        {/* Help & Support Section */}
        <SectionTitle text="Help & Support" color={colors.textSecondary} />
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <SettingsItemPro 
            icon="help-circle-outline" 
            iconBg={isDark ? '#1F2A3F' : '#E8F0F7'}
            label="FAQ & Help Center" 
            subtext="Find answers to common questions"
            onPress={() => navigation.navigate('FAQScreen')} 
            colors={colors} 
            showDivider
          />
          <SettingsItemPro 
            icon="phone-outline" 
            iconBg={isDark ? '#1F2A3F' : '#E8F0F7'}
            label="Contact Support" 
            subtext="Get help from our team"
            onPress={() => navigation.navigate('ContactUs')} 
            colors={colors} 
            showDivider
          />
          <SettingsItemPro 
            icon="lock-outline" 
            iconBg={isDark ? '#1F2A3F' : '#E8F0F7'}
            label="Terms & Privacy" 
            subtext="Legal information and policies"
            onPress={() => navigation.navigate('TermsPrivacyScreen')} 
            colors={colors} 
          />
        </View>

        {/* Account Management Section */}
        <SectionTitle text="Account & Profile" color={colors.textSecondary} />
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <SettingsItemPro 
            icon="account-circle-outline" 
            iconBg={isDark ? '#3F2A1F' : '#F7EFE8'}
            label="Edit Profile" 
            subtext="Update your information"
            onPress={() => navigation.navigate('EditProfile')} 
            colors={colors} 
            showDivider
          />
          <SettingsItemPro 
            icon="logout" 
            iconBg={isDark ? '#3F1F1F' : '#F7E8E8'}
            label="Sign Out" 
            subtext="Logout from your account"
            colors={colors} 
            isDestructive
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const SectionTitle = ({ text, color }) => (
  <Text style={[styles.sectionTitle, { color }]}>{text}</Text>
);

const SettingsItemPro = ({ icon, iconBg, label, subtext, onPress, colors, badgeCount, showDivider, isDestructive }) => (
  <>
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={20} color={isDestructive ? '#EF4444' : colors.accent} />
        </View>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemLabel, { color: isDestructive ? '#EF4444' : colors.text }]}>
          {label}
        </Text>
        {subtext && (
          <Text style={[styles.itemSubtext, { color: colors.textSecondary }]}>
            {subtext}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
    {showDivider && (
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    )}
  </>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scroll: { 
    padding: 20,
    paddingTop: 60,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileSection: { 
    borderRadius: 16, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 32,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: { 
    width: '100%', 
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 14,
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  section: {
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  itemContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leftContent: {
    position: 'relative',
    marginRight: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: { 
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginLeft: 72,
    marginRight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});