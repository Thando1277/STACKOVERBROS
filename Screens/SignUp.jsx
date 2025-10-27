import React, { useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig';
import { db } from '../Firebase/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';


const { height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [emailSignUp, setEmailSignUp] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordSignUp, setPasswordSignUp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const [loadingSignUp, setLoadingSignUp] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [activeInput, setActiveInput] = useState(''); // Track focused input

  const signUpAnim = useRef(new Animated.Value(0)).current; // SignUp form initial position
  const loginAnim = useRef(new Animated.Value(height)).current; // Login form initial position

  // Show Login Form
  const handleGoToLogin = () => {
    Animated.timing(signUpAnim, {
      toValue: -height,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(loginAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Show SignUp Form again
  const handleGoToSignUp = () => {
    Animated.timing(loginAnim, {
      toValue: height,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(signUpAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleSignUp = async () => {
    if (!fullName || !emailSignUp || !phone || !passwordSignUp || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (passwordSignUp !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoadingSignUp(true);
    try {
      console.log('🔵 Starting signup process...');
      console.log('📝 Full Name:', fullName);
      console.log('📧 Email:', emailSignUp);
      console.log('📱 Phone:', phone);
      
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, emailSignUp, passwordSignUp);
      const userId = userCredential.user.uid;
      console.log('✅ Auth account created. User ID:', userId);

      // Save user data to Firestore
      const userData = {
        fullname: fullName,
        email: emailSignUp,
        phone: phone,
        createdAt: serverTimestamp(),
      };
      
      console.log('💾 Saving to Firestore:', userData);
      await setDoc(doc(db, "users", userId), userData);
      console.log('✅ User data saved to Firestore successfully!');

      // Verify it was saved
      const savedDoc = await getDoc(doc(db, "users", userId));
      if (savedDoc.exists()) {
        console.log('✅ VERIFIED: Document exists in Firestore:', savedDoc.data());
      } else {
        console.log('❌ ERROR: Document was NOT saved to Firestore!');
      }

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('❌ Sign up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert('Sign Up Failed', error.message || 'Please check your details and try again.');
    } finally {
      setLoadingSignUp(false);
    }
  };

  const handleLogIn = async () => {
    if (!emailLogin || !passwordLogin) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      Alert.alert('Success', 'You are logged in!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Login Failed', 'Email or password is incorrect.');
    } finally {
      setLoadingLogin(false);
    }
  };

  // Helper function for icon color
  const getIconColor = (fieldValue, fieldName) => {
    return activeInput === fieldName || fieldValue ? '#0FC436' : '#6B6B6B';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* SignUp Form */}
            <Animated.View style={[styles.formWrapper, { transform: [{ translateY: signUpAnim }] }]}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/FINDSOS-LOGO2.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up to get started with FINDSOS</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="user"
                      size={16}
                      color={getIconColor(fullName, 'fullName')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setFullName}
                      value={fullName}
                      onFocus={() => setActiveInput('fullName')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="envelope"
                      size={16}
                      color={getIconColor(emailSignUp, 'emailSignUp')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setEmailSignUp}
                      value={emailSignUp}
                      onFocus={() => setActiveInput('emailSignUp')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="phone"
                      size={18}
                      color={getIconColor(phone, 'phone')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setPhone}
                      value={phone}
                      onFocus={() => setActiveInput('phone')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="lock"
                      size={18}
                      color={getIconColor(passwordSignUp, 'passwordSignUp')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      secureTextEntry
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setPasswordSignUp}
                      value={passwordSignUp}
                      onFocus={() => setActiveInput('passwordSignUp')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="lock"
                      size={18}
                      color={getIconColor(confirmPassword, 'confirmPassword')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      secureTextEntry
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setConfirmPassword}
                      value={confirmPassword}
                      onFocus={() => setActiveInput('confirmPassword')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* SignUp Button */}
                <TouchableOpacity style={{ width: '95%', marginTop: 10 }} onPress={handleSignUp}>
                  <LinearGradient
                    colors={['#0FC436', '#34D17D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginBtn}
                  >
                    {loadingSignUp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Go to Login + Social */}
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <View style={styles.textRow}>
                    <Text style={styles.text}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleGoToLogin}>
                      <Text style={styles.link}>Log In</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: '95%', marginTop: 15, alignItems: 'center' }}>
                    <Text style={styles.socialTitle}>Continue with</Text>
                    <View style={styles.socialRow}>
                      <TouchableOpacity style={styles.socialBtn}>
                        <Icon name="google" size={18} color="black" />
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.socialBtn}>
                        <Icon name="apple" size={18} color="#000" />
                        <Text style={styles.socialText}>Apple</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Login Form */}
            <Animated.View style={[styles.formWrapper, { transform: [{ translateY: loginAnim }] }]}>
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
                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="envelope"
                      size={16}
                      color={getIconColor(emailLogin, 'emailLogin')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setEmailLogin}
                      value={emailLogin}
                      onFocus={() => setActiveInput('emailLogin')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon
                      name="lock"
                      size={16}
                      color={getIconColor(passwordLogin, 'passwordLogin')}
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      secureTextEntry
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setPasswordLogin}
                      value={passwordLogin}
                      onFocus={() => setActiveInput('passwordLogin')}
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* LogIn Button */}
                <TouchableOpacity style={{ width: '95%', marginTop: 10 }} onPress={handleLogIn}>
                  <LinearGradient
                    colors={['#0FC436', '#34D17D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginBtn}
                  >
                    {loadingLogin ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginBtnText}>Log In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Go to SignUp + Forgot Password */}
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <View style={styles.textRow}>
                    <Text style={styles.text}>Don't have an account? </Text>
                    <TouchableOpacity onPress={handleGoToSignUp}>
                      <Text style={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={[styles.link, { marginTop: 5, fontSize: 12 }]}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Social Buttons */}
                  <View style={{ width: '95%', marginTop: 15, alignItems: 'center' }}>
                    <Text style={styles.socialTitle}>Continue with</Text>
                    <View style={styles.socialRow}>
                      <TouchableOpacity style={styles.socialBtn}>
                        <Icon name="google" size={18} color="black" />
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.socialBtn}>
                        <Icon name="apple" size={18} color="#000" />
                        <Text style={styles.socialText}>Apple</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  formWrapper: { position: 'absolute', width: '100%', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 120, height: 90 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1F1F', marginTop: 6 },
  subtitle: { fontSize: 13, color: '#777', marginTop: 2, textAlign: 'center' },
  formContainer: { width: '100%', alignItems: 'center' },
  fieldGroup: { width: '95%', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '500', color: '#333', marginBottom: 3 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  icon: { marginRight: 6 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  loginBtn: {
    borderRadius: 8,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  socialText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  socialTitle: {
    fontSize: 13,
    color: '#777',
    marginBottom: 6,
    fontWeight: '500',
  },
  textRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  text: { color: '#555', fontSize: 13 },
  link: { color: '#0FC436', fontWeight: '600', fontSize: 13 },
});