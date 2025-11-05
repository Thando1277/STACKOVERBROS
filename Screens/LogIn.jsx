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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../Firebase/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const { height, width } = Dimensions.get('window');
const defaultAvatar = null;

// Custom Alert Component
const CustomAlert = ({ visible, title, message, type, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const iconName = type === 'success' ? 'checkmark-circle' : 'alert-circle';
  const iconColor = type === 'success' ? '#0FC436' : '#FF3B30';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.alertIconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName} size={48} color={iconColor} />
          </View>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.alertButton, { backgroundColor: iconColor }]}>
            <Text style={styles.alertButtonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
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
    Animated.parallel([
      Animated.timing(signUpAnim, { toValue: -height, duration: 400, useNativeDriver: true }),
      Animated.timing(loginAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  };

  const handleGoToSignUp = () => {
    Animated.parallel([
      Animated.timing(loginAnim, { toValue: height, duration: 400, useNativeDriver: true }),
      Animated.timing(signUpAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  };

  // --- Firebase handlers
  const handleSignUp = async () => {
    if (!fullName || !emailSignUp || !phone || !passwordSignUp || !confirmPassword) {
      showAlert('Missing Information', 'Please fill in all fields.', 'error');
      return;
    }
    if (passwordSignUp !== confirmPassword) {
      showAlert('Password Mismatch', 'Your passwords do not match.', 'error');
      return;
    }

    setLoadingSignUp(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailSignUp, passwordSignUp);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullname: fullName,
        email: emailSignUp,
        phone: phone,
        avatar: defaultAvatar,
        createdAt: serverTimestamp(),
      });

      setLoadingSignUp(false);
      showAlert('Welcome!', 'Your account has been created successfully.', 'success');
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch (error) {
      setLoadingSignUp(false);
      showAlert('Sign Up Failed', error.message, 'error');
    }
  };

  const handleLogIn = async () => {
    if (!emailLogin || !passwordLogin) {
      showAlert('Missing Information', 'Please enter your email and password.', 'error');
      return;
    }

    setLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setLoadingLogin(false);
      showAlert('Welcome Back!', 'Login successful.', 'success');
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch (error) {
      setLoadingLogin(false);
      showAlert('Login Failed', 'Invalid email or password.', 'error');
    }
  };

  const getBorderColor = (fieldValue, fieldName) => 
    activeInput === fieldName ? '#0FC436' : '#E8E8E8';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>

            {/* SignUp Form */}
            <Animated.View style={[styles.formWrapper, { transform: [{ translateY: signUpAnim }] }]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image 
                    source={require('../assets/FINDSOS-LOGO2.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Join FINDSOS to help find missing loved ones</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(fullName,'fullName') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="person" size={20} color={activeInput === 'fullName' || fullName ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#A0A0A0"
                      onChangeText={setFullName} 
                      value={fullName}
                      onFocus={() => setActiveInput('fullName')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(emailSignUp,'emailSignUp') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail" size={20} color={activeInput === 'emailSignUp' || emailSignUp ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Email Address"
                      keyboardType="email-address" 
                      autoCapitalize="none" 
                      placeholderTextColor="#A0A0A0"
                      onChangeText={setEmailSignUp} 
                      value={emailSignUp}
                      onFocus={() => setActiveInput('emailSignUp')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(phone,'phone') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="call" size={20} color={activeInput === 'phone' || phone ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Phone Number" 
                      keyboardType="phone-pad"
                      placeholderTextColor="#A0A0A0" 
                      onChangeText={setPhone} 
                      value={phone}
                      onFocus={() => setActiveInput('phone')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(passwordSignUp,'passwordSignUp') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="lock-closed" size={20} color={activeInput === 'passwordSignUp' || passwordSignUp ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Password" 
                      secureTextEntry
                      placeholderTextColor="#A0A0A0" 
                      onChangeText={setPasswordSignUp} 
                      value={passwordSignUp}
                      onFocus={() => setActiveInput('passwordSignUp')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(confirmPassword,'confirmPassword') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="lock-closed" size={20} color={activeInput === 'confirmPassword' || confirmPassword ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Confirm Password" 
                      secureTextEntry
                      placeholderTextColor="#A0A0A0" 
                      onChangeText={setConfirmPassword} 
                      value={confirmPassword}
                      onFocus={() => setActiveInput('confirmPassword')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* SignUp Button */}
                <TouchableOpacity 
                  style={[styles.mainButton, { opacity: loadingSignUp ? 0.7 : 1 }]} 
                  onPress={handleSignUp}
                  disabled={loadingSignUp}
                >
                  <LinearGradient 
                    colors={['#0FC436','#34D17D']} 
                    start={{x:0,y:0}} 
                    end={{x:1,y:0}} 
                    style={styles.gradientButton}
                  >
                    {loadingSignUp ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch to Login */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Already have an account? </Text>
                  <TouchableOpacity onPress={handleGoToLogin}>
                    <Text style={styles.switchLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Login Form */}
            <Animated.View style={[styles.formWrapper, { transform: [{ translateY: loginAnim }] }]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image 
                    source={require('../assets/FINDSOS-LOGO2.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue helping find missing loved ones</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Email */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(emailLogin,'emailLogin') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail" size={20} color={activeInput === 'emailLogin' || emailLogin ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Email Address" 
                      keyboardType="email-address"
                      autoCapitalize="none" 
                      placeholderTextColor="#A0A0A0"
                      onChangeText={setEmailLogin} 
                      value={emailLogin}
                      onFocus={() => setActiveInput('emailLogin')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <View style={[styles.inputWrapper, { borderColor: getBorderColor(passwordLogin,'passwordLogin') }]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="lock-closed" size={20} color={activeInput === 'passwordLogin' || passwordLogin ? '#0FC436' : '#A0A0A0'} />
                    </View>
                    <TextInput
                      style={styles.input} 
                      placeholder="Password" 
                      secureTextEntry
                      placeholderTextColor="#A0A0A0" 
                      onChangeText={setPasswordLogin} 
                      value={passwordLogin}
                      onFocus={() => setActiveInput('passwordLogin')} 
                      onBlur={() => setActiveInput('')}
                    />
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ResetPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.mainButton, { opacity: loadingLogin ? 0.7 : 1 }]} 
                  onPress={handleLogIn}
                  disabled={loadingLogin}
                >
                  <LinearGradient 
                    colors={['#0FC436','#34D17D']} 
                    start={{x:0,y:0}} 
                    end={{x:1,y:0}} 
                    style={styles.gradientButton}
                  >
                    {loadingLogin ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch to SignUp */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={handleGoToSignUp}>
                    <Text style={styles.switchLink}>Create Account</Text>
                  </TouchableOpacity>
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
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24 
  },
  formWrapper: { 
    position: 'absolute', 
    width: '100%', 
    alignItems: 'center' 
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 20  // Reduced from 32
  },
  logoCircle: {
    width: 70,  // Reduced from 100
    height: 70,  // Reduced from 100
    borderRadius: 35,  // Reduced from 50
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,  // Reduced from 16
    shadowColor: '#0FC436',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: { 
    width: 50,  // Reduced from 70
    height: 50  // Reduced from 70
  },
  title: { 
    fontSize: 22,  // Reduced from 26
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 6  // Reduced from 8
  },
  subtitle: { 
    fontSize: 12,  // Reduced from 14
    color: '#6B7280', 
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 17,  // Reduced from 20
  },
  formContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  fieldGroup: { 
    width: '100%', 
    marginBottom: 10  // Reduced from 16
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,  // Reduced from 12
    borderWidth: 2,
    paddingHorizontal: 12,  // Reduced from 16
    height: 44,  // Reduced from 56
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 8,  // Reduced from 12
  },
  input: { 
    flex: 1, 
    fontSize: 14,  // Reduced from 15
    color: '#1A1A1A',
    fontWeight: '500',
  },
  mainButton: {
    width: '100%',
    marginTop: 6,  // Reduced from 8
    marginBottom: 14,  // Reduced from 20
  },
  gradientButton: { 
    borderRadius: 10,  // Reduced from 12
    height: 44,  // Reduced from 56
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#0FC436',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15,  // Reduced from 16
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 14,  // Reduced from 20
  },
  forgotPasswordText: {
    color: '#0FC436',
    fontSize: 12,  // Reduced from 13
    fontWeight: '600',
  },
  switchContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  switchText: { 
    color: '#6B7280', 
    fontSize: 13,  // Reduced from 14
    fontWeight: '500',
  },
  switchLink: { 
    color: '#0FC436', 
    fontWeight: '700', 
    fontSize: 13  // Reduced from 14
  },
  // Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,  // Reduced from 24
    padding: 24,  // Reduced from 28
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  alertIconContainer: {
    width: 64,  // Reduced from 80
    height: 64,  // Reduced from 80
    borderRadius: 32,  // Reduced from 40
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,  // Reduced from 16
  },
  alertTitle: {
    fontSize: 18,  // Reduced from 20
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,  // Reduced from 8
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,  // Reduced from 14
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,  // Reduced from 24
    lineHeight: 18,  // Reduced from 20
  },
  alertButton: {
    paddingVertical: 12,  // Reduced from 14
    paddingHorizontal: 40,  // Reduced from 48
    borderRadius: 10,  // Reduced from 12
    minWidth: 100,  // Reduced from 120
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 15,  // Reduced from 16
    fontWeight: '700',
    textAlign: 'center',
  },
});

