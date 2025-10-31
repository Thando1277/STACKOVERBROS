import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";


export default function TermsPrivacyScreen({ navigation }) {
  const ShadowBox = ({ children }) => (
    <View style={styles.shadowBox}>
      <Text style={styles.paragraph}>{children}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back Button inside scroll */}
        <TouchableOpacity
          style={styles.backButtonInline}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color="#7CC242" />
        </TouchableOpacity>

        {/* Terms of Service */}
        <Text style={styles.title}>Terms of Service</Text>
        <ShadowBox>
          Welcome to FindSOS (“we,” “our,” or “us”). By downloading, accessing,
          or using our mobile application or related services (the “Service”),
          you agree to these Terms of Service. If you do not agree, do not use
          the Service.
        </ShadowBox>

        <Text style={styles.section}>1. Use of the Service</Text>
        <ShadowBox>
          You must be at least 13 years old to use the Service. You agree to use
          the Service only for lawful purposes and in accordance with these
          Terms.
        </ShadowBox>

        <Text style={styles.section}>2. Accounts</Text>
        <ShadowBox>
          You are responsible for maintaining the confidentiality of your login
          information and for all activities under your account.
        </ShadowBox>

        <Text style={styles.section}>3. Intellectual Property</Text>
        <ShadowBox>
          All content, trademarks, logos, and software are owned by or licensed
          to FindSOS. You may not copy or distribute without permission.
        </ShadowBox>

        <Text style={styles.section}>4. Limitation of Liability</Text>
        <ShadowBox>
          The Service is provided “as is” without warranties of any kind. We are
          not liable for any indirect or consequential damages.
        </ShadowBox>

        {/* Privacy Policy */}
        <Text style={styles.title}>Privacy Policy</Text>
        <ShadowBox>Effective Date: [Insert Date]</ShadowBox>

        <Text style={styles.section}>1. Information We Collect</Text>
        <ShadowBox>
          - Personal information such as name and email address.{"\n"}
          - Usage data like device type and app activity.{"\n"}
          - Location data if you grant permission.
        </ShadowBox>

        <Text style={styles.section}>2. How We Use Information</Text>
        <ShadowBox>
          We use your data to provide and improve the Service, respond to
          support requests, and comply with legal obligations.
        </ShadowBox>

        <Text style={styles.section}>3. Sharing of Information</Text>
        <ShadowBox>
          We never sell your personal data. We may share data with trusted
          service providers who help operate the Service under confidentiality
          agreements.
        </ShadowBox>

        <Text style={styles.section}>4. Data Security</Text>
        <ShadowBox>
          We use industry-standard security measures, but no method of
          transmission is completely secure.
        </ShadowBox>

        <Text style={styles.section}>5. Contact</Text>
        <ShadowBox>
          Questions? Email us at support@findsos.example.
        </ShadowBox>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // dark background
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButtonInline: {
    marginBottom: 15,
  },
  backButtonText: {
    color: '#7CC242',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#fff',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#7CC242',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ccc',
  },
  shadowBox: {
    backgroundColor: '#1e1e1e', // dark box
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    // Android shadow
    elevation: 4,
  },
});
