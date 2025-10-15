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
  useEffect,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();


  const handleLogIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'You are logged in!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Login Failed', 'Email or password is incorrect.');
    } finally {
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue to FINDSOS</Text>
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

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#6B6B6B" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                placeholderTextColor="#A1A1A1"
                onChangeText={setPassword}
                value={password}
              />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogIn}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.textRow}>
              <Text style={styles.text}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.textRow}>
              <Text style={styles.text}>Forgot password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ResetPasswordScreen')}>
                <Text style={styles.link}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="google" size={18} color="black" />
              <Text style={styles.socialText}>  Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Icon name="apple" size={18} color="black" />
              <Text style={styles.socialText}>  Apple</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 160,
    height: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1F1F',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  loginBtn: {
    backgroundColor: '#0FC436',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  text: {
    color: '#555',
    fontSize: 14,
  },
  link: {
    color: '#0FC436',
    fontWeight: '600',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    color: '#777',
    marginHorizontal: 10,
    fontSize: 13,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 40,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialText: {
    fontWeight: '600',
    fontSize: 14,
    color: 'black',
  },
});
