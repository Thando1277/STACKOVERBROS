import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Keyboard, ActivityIndicator } from 'react-native'
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {FontAwesome as Icon} from 'react-native-vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../Firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!fullname || !email || !phone || !password || !confirmPassword){
      Alert.alert('SignUp Failed', 'Fill out all the fields');
      return;
    }
    if (password !== confirmPassword){
      Alert.alert('Passwords do not match');
      return;
    }
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        fullname: fullname,
        email: user.email,
        phone: phone,
        createdAt: new Date(),
      });
      Keyboard.dismiss();
      Alert.alert('Success', 'Account registered successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Home')}
      ])
    }catch(error){
      Alert.alert('Error creating account:', 'Fill in all the fields');
    }finally{
      setLoading(false)
    }
  }



  return (
    <LinearGradient
      colors={['#0FC436', '#4c811dff', '#35640cff']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/FINDSOS-LOGO2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>WELCOME TO FINDSOS</Text>

        {/* Form Section with Icons */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="user" size={16} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder='Fullname'
              placeholderTextColor="#999"
              value={fullname}
              onChangeText={setFullname}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="envelope" size={16} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder='Email'
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              onChangeText={setEmail}
              value={email}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="phone" size={16} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder='Phone'
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={16} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder='Password'
              secureTextEntry={true}
              placeholderTextColor="#999"
              onChangeText={setPassword}
              value={password}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={16} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder='Confirm Password'
              secureTextEntry={true}
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color='black'/>
            </View>
          )}

          <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Login Prompt */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Have an Account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or Sign Up With</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Sign Up Options */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}><Icon name="google" size={16} color="black" style={styles.icon} />  Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}><Icon name="apple" size={16} color="black" style={styles.icon} />   Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}

export default SignUp

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingVertical: 30,
    },
    logoContainer: {
        alignItems: 'center',
        width: '100%',
        flex: 2,
        justifyContent: 'flex-end',
    },
    logo: {
        width: 250,
        height: 180,
        resizeMode: 'contain',
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 30,
        color: 'white',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 10,
        flex: 3,
        justifyContent: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        maxWidth: 300,
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 38,
        color: '#333',
        fontSize: 14,
    },
    signUpBtn: {
        backgroundColor: 'black',
        borderRadius: 5,
        width: '90%',
        maxWidth: 300,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    signUpText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loginContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    loginText: {
        color: 'white',
        fontSize: 13,
    },
    loginLink: {
        color: 'white',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        fontSize: 13,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginVertical: 15,
        flex: 1,
        justifyContent: 'center',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'white',
    },
    dividerText: {
        marginHorizontal: 8,
        color: 'white',
        fontSize: 12,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        flex: 1,
        marginBottom: 20,
    },
    socialButton: {
        backgroundColor: 'white',
        borderRadius: 5,
        width: 150,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    }
})