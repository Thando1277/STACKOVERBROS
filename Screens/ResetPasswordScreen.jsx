import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../Firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleResetPassword = async () => {
    if(!email.trim()){
      Alert.alert('Missing Email', 'Please enter your email.')
      return;
    }

    try {
      setLoading(true);
      await  sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset Link Sent',
        'Check your email for link to reset your password'
      );
      navigation.navigate('LogIn');
    }catch(error){
      let message = 'Failed to send reset link';
      if (error.code === 'auth/invalid-email'){
        message = 'Please enter a valid email address.';
      }else if (error.code === 'auth/user-not-found'){
        message = 'No account found with that email.';
      }
      Alert.alert('Error', message);
    }finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/FINDSOS-LOGO2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a password reset link
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="envelope" size={18} color="#6B6B6B" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A1A1A1"
                onChangeText={setEmail}
                value={email}
              />
            </View>

            <TouchableOpacity style={styles.resetBtn} >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetBtnText} onPress={handleResetPassword} disabled={loading}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <View style={styles.textRow}>
              <Text style={styles.text}>Remembered your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text style={styles.link}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Keep the same styles you already have
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scrollContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginTop: 40 },
  logo: { width: 160, height: 120 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F1F1F', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#777', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  formContainer: { width: '100%', marginTop: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6', borderRadius: 10, paddingHorizontal: 12, height: 48, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  resetBtn: { backgroundColor: '#0FC436', borderRadius: 10, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#0FC436', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 3 },
  resetBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  textRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  text: { color: '#555', fontSize: 14 },
  link: { color: '#0FC436', fontWeight: '600', fontSize: 14 },
});
