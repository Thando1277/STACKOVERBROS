import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleLogIn = async () => {
    if (!email || !password){
      Alert.alert('Please enter email and password');
      return;
    }
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in');
      navigation.navigate('Home');
    }catch(error){
      Alert.alert('Login failed', 'Email or password incorrect!');
    }finally{
      setLoading(false);
    }
  }



  return (
    <LinearGradient
      colors={['#0FC436', '#4c811dff', '#35640cff']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/FINDSOS-LOGO2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeText}>WELCOME BACK TO FINDSOS</Text>


        <View style={styles.formContainer}>

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

          <TouchableOpacity style={styles.LogInBtn} onPress={handleLogIn}>
            <Text style={styles.logIn}>Log In</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color='black'/>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Don't have an Account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.loginLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or Log In With</Text>
          <View style={styles.divider} />
        </View>

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

export default LogIn

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
    LogInBtn: {
        backgroundColor: 'black',
        borderRadius: 5,
        width: '90%',
        maxWidth: 300,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    logIn: {
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