import React, { useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig';

const { height } = Dimensions.get('window');

// Custom Alert Component
const CustomAlert = ({ visible, title, message, type, onClose }) => {
  const backgroundColor = type === 'success' ? 'white' : type === 'error' ? '#fff' : '#FFF3CD';
  const borderColor = type === 'success' ? '#0FC436' : type === 'error' ? '#0FC436' : '#FFC107';
  const textColor = type === 'success' ? '#155724' : type === 'error' ? '#155724' : '#856404';
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle';
  const iconColor = type === 'success' ? '#0FC436' : type === 'error' ? '#0FC436' : '#FFC107';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <View style={[styles.alertBox, { backgroundColor, borderColor }]}>
          <Icon name={iconName} size={40} color={iconColor} style={{ marginBottom: 10 }} />
          <Text style={[styles.alertTitle, { color: textColor }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: textColor }]}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.alertButton, { backgroundColor: iconColor }]}>
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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

  // --- Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  // --- Animation refs
  const signUpAnim = useRef(new Animated.Value(0)).current;
  const loginAnim = useRef(new Animated.Value(height)).current;

  // Custom alert function
  const showAlert = (title, message, type = 'success') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

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
      showAlert('Missing Fields', 'Please fill in all fields.', 'error');
      return;
    }
    if (passwordSignUp !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.', 'error');
      return;
    }
    setLoadingSignUp(true);
    try {
      await createUserWithEmailAndPassword(auth, emailSignUp, passwordSignUp);
      setLoadingSignUp(false);
      showAlert('Success', 'Account created successfully!', 'success');
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch {
      setLoadingSignUp(false);
      showAlert('Sign Up Failed', 'Please check your details and try again.', 'error');
    }
  };

  const handleLogIn = async () => {
    if (!emailLogin || !passwordLogin) {
      showAlert('Missing Fields', 'Please enter both email and password.', 'error');
      return;
    }
    setLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setLoadingLogin(false);
      showAlert('Success', 'You are logged in!', 'success');
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch {
      setLoadingLogin(false);
      showAlert('Login Failed', 'Email or password is incorrect.', 'error');
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
              <View style={styles.logoContainer}>
                <Image source={require('../assets/FINDSOS-LOGO2.png')} style={styles.logo} resizeMode="contain"/>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up to get started with FINDSOS</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="user" size={16} color={getIconColor(fullName,'fullName')} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#A1A1A1"
                      onChangeText={setFullName} value={fullName}
                      onFocus={() => setActiveInput('fullName')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="envelope" size={16} color={getIconColor(emailSignUp,'emailSignUp')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Enter your email"
                      keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A1A1A1"
                      onChangeText={setEmailSignUp} value={emailSignUp}
                      onFocus={() => setActiveInput('emailSignUp')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="phone" size={18} color={getIconColor(phone,'phone')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Enter your phone number" keyboardType="phone-pad"
                      placeholderTextColor="#A1A1A1" onChangeText={setPhone} value={phone}
                      onFocus={() => setActiveInput('phone')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="lock" size={18} color={getIconColor(passwordSignUp,'passwordSignUp')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Enter password" secureTextEntry
                      placeholderTextColor="#A1A1A1" onChangeText={setPasswordSignUp} value={passwordSignUp}
                      onFocus={() => setActiveInput('passwordSignUp')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="lock" size={18} color={getIconColor(confirmPassword,'confirmPassword')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Re-enter password" secureTextEntry
                      placeholderTextColor="#A1A1A1" onChangeText={setConfirmPassword} value={confirmPassword}
                      onFocus={() => setActiveInput('confirmPassword')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* SignUp Button */}
                <TouchableOpacity style={{width:'95%', marginTop:10}} onPress={handleSignUp}>
                  <LinearGradient colors={['#0FC436','#34D17D']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.loginBtn}>
                    {loadingSignUp ? <ActivityIndicator color="#fff"/> : <Text style={styles.loginBtnText}>Sign Up</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Already have account + Social */}
                <View style={{alignItems:'center', marginTop:8}}>
                  <View style={styles.textRow}>
                    <Text style={styles.text}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleGoToLogin}>
                      <Text style={styles.link}>Log In</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Continue with */}
                  <View style={{alignItems:'center', marginTop:15, width:'95%'}}>
                    <Text style={{color:'#555', marginBottom:10}}>Or continue with</Text>
                    <View style={{flexDirection:'row', justifyContent:'center', width:'100%'}}>
                      <TouchableOpacity style={styles.socialBtn} onPress={() => showAlert('Google Login', 'Google login feature coming soon!', 'warning')}>
                        <Icon name="google" size={18} color="#DB4437" />
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.socialBtn} onPress={() => showAlert('Apple Login', 'Apple login feature coming soon!', 'warning')}>
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
                <Image source={require('../assets/FINDSOS-LOGO2.png')} style={styles.logo} resizeMode="contain"/>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Log in to continue to FINDSOS</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="envelope" size={16} color={getIconColor(emailLogin,'emailLogin')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Enter your email" keyboardType="email-address"
                      autoCapitalize="none" placeholderTextColor="#A1A1A1"
                      onChangeText={setEmailLogin} value={emailLogin}
                      onFocus={() => setActiveInput('emailLogin')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputGroup}>
                    <Icon name="lock" size={16} color={getIconColor(passwordLogin,'passwordLogin')} style={styles.icon} />
                    <TextInput
                      style={styles.input} placeholder="Enter password" secureTextEntry
                      placeholderTextColor="#A1A1A1" onChangeText={setPasswordLogin} value={passwordLogin}
                      onFocus={() => setActiveInput('passwordLogin')} onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity style={{width:'95%', marginTop:10}} onPress={handleLogIn}>
                  <LinearGradient colors={['#0FC436','#34D17D']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.loginBtn}>
                    {loadingLogin ? <ActivityIndicator color="#fff"/> : <Text style={styles.loginBtnText}>Log In</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Don't have account + Social */}
                <View style={{alignItems:'center', marginTop:8}}>
                  <View style={styles.textRow}>
                    <Text style={styles.text}>Don't have an account? </Text>
                    <TouchableOpacity onPress={handleGoToSignUp}>
                      <Text style={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
                    <Text style={[styles.link, {marginTop:5, fontSize:12}]}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Continue with */}
                  <View style={{alignItems:'center', marginTop:15, width:'95%'}}>
                    <Text style={{color:'#555', marginBottom:10}}>Or continue with</Text>
                    <View style={{flexDirection:'row', justifyContent:'center', width:'100%'}}>
                      <TouchableOpacity style={styles.socialBtn} onPress={() => showAlert('Google Login', 'Google login feature coming soon!', 'warning')}>
                        <Icon name="google" size={18} color="#DB4437" />
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.socialBtn} onPress={() => showAlert('Apple Login', 'Apple login feature coming soon!', 'warning')}>
                        <Icon name="apple" size={18} color="#000" />
                        <Text style={styles.socialText}>Apple</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

              </View>
            </Animated.View>

            {/* Custom Alert */}
            <CustomAlert
              visible={alertVisible}
              title={alertTitle}
              message={alertMessage}
              type={alertType}
              onClose={() => setAlertVisible(false)}
            />

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
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});