import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function TermsPrivacyScreen({ navigation }) {
  const { colors } = useTheme();

  const ShadowBox = ({ children }) => (
    <View style={[styles.shadowBox, { backgroundColor: colors.card }]}>
      <Text style={[styles.paragraph, { color: colors.text }]}>{children}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={scale(28)} color="#7CC242" />
        </TouchableOpacity>
        <View style={{ width: scale(28) }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>


        <Text style={[styles.title, { color: '#7CC242' }]}>Terms of Service</Text>
        <ShadowBox>
          Welcome to FindSOS (“we,” “our,” or “us”). By downloading, accessing,
          or using our mobile application or related services (the “Service”),
          you agree to these Terms of Service. If you do not agree, do not use
          the Service.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>1. Use of the Service</Text>
        <ShadowBox>
          You must be at least 13 years old to use the Service. You agree to use
          the Service only for lawful purposes and in accordance with these Terms.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>2. Accounts</Text>
        <ShadowBox>
          You are responsible for maintaining the confidentiality of your login
          information and for all activities under your account.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>3. Intellectual Property</Text>
        <ShadowBox>
          All content, trademarks, logos, and software are owned by or licensed
          to FindSOS. You may not copy or distribute without permission.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>4. Limitation of Liability</Text>
        <ShadowBox>
          The Service is provided “as is” without warranties of any kind. We are
          not liable for any indirect or consequential damages.
        </ShadowBox>

        <Text style={[styles.title, { color: '#7CC242' }]}>Privacy Policy</Text>
        <ShadowBox>Effective Date: [Insert Date]</ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>1. Information We Collect</Text>
        <ShadowBox>
          - Personal information such as name and email address.{"\n"}
          - Usage data like device type and app activity.{"\n"}
          - Location data if you grant permission.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>2. How We Use Information</Text>
        <ShadowBox>
          We use your data to provide and improve the Service, respond to
          support requests, and comply with legal obligations.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>3. Sharing of Information</Text>
        <ShadowBox>
          We never sell your personal data. We may share data with trusted
          service providers who help operate the Service under confidentiality
          agreements.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>4. Data Security</Text>
        <ShadowBox>
          We use industry-standard security measures, but no method of
          transmission is completely secure.
        </ShadowBox>

        <Text style={[styles.section, { color: '#7CC242' }]}>5. Contact</Text>
        <ShadowBox>
          Questions? Email us at support@findsos.example.
        </ShadowBox>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  backButtonInline: { marginBottom: 15 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  paragraph: { fontSize: 16, lineHeight: 24 },
  shadowBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderBottomWidth: 0.3,
  },
});
