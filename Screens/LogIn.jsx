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

const { height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  // --- SignUp state
  const [fullName, setFullName] = useState('');
  const [emailSignUp, setEmailSignUp] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordSignUp, setPasswordSignUp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Login state
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  // --- Loading
  const [loadingSignUp, setLoadingSignUp] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  // --- Input focus tracking
  const [activeInput, setActiveInput] = useState('');

  // --- Animation refs
  const signUpAnim = useRef(new Animated.Value(0)).current;
  const loginAnim = useRef(new Animated.Value(height)).current;

  // --- Switch forms
  const handleGoToLogin = () => {
    Animated.timing(signUpAnim, { toValue: -height, duration: 500, useNativeDriver: true }).start();
    Animated.timing(loginAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  };

  const handleGoToSignUp = () => {
    Animated.timing(loginAnim, { toValue: height, duration: 500, useNativeDriver: true }).start();
    Animated.timing(signUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  };

  // --- Firebase handlers
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
      await createUserWithEmailAndPassword(auth, emailSignUp, passwordSignUp);
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Home');
    } catch {
      Alert.alert('Sign Up Failed', 'Please check your details and try again.');
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
    } catch {
      Alert.alert('Login Failed', 'Email or password is incorrect.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const getIconColor = (fieldValue, fieldName) => activeInput === fieldName || fieldValue ? '#0FC436' : '#6B6B6B';

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
              {/* ... SIGNUP FORM CODE HERE ... */}
              {/* Make sure all Views and TouchableOpacity are properly closed */}
            </Animated.View>

            {/* Login Form */}
            <Animated.View style={[styles.formWrapper, { transform: [{ translateY: loginAnim }] }]}>
              {/* ... LOGIN FORM CODE HERE ... */}
              {/* Make sure all Views and TouchableOpacity are properly closed */}
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
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6', borderRadius: 8, paddingHorizontal: 10, height: 42, borderWidth: 1, borderColor: '#E0E0E0' },
  icon: { marginRight: 6 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  loginBtn: { borderRadius: 8, height: 42, alignItems: 'center', justifyContent: 'center', width: '100%' },
  loginBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  textRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  text: { color: '#555', fontSize: 13 },
  link: { color: '#0FC436', fontWeight: '600', fontSize: 13 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    flex: 1
  },
  socialText: { fontSize: 14, color: '#333', fontWeight: '500' },
});
