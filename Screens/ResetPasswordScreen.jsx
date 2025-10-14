import { StyleSheet, Text, View, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import React from 'react'

function ResetPasswordScreen(){
  return (
    <LinearGradient
        colors={['#0FC436', '#4c811dff', '#35640cff']}
        style={styles.gradient}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <Image source={require('../assets/FINDSOS-LOGO2.png')}/>
                <Text style={{color: 'white', fontWeight: 'bold', fontSize: 35}}>Reset Password</Text>
                <View style={styles.inputContainer}>
                    <Icon name="envelope" size={16} color="#666" style={styles.icon} />
                    <TextInput
                        placeholder='Enter email..'
                        style={styles.input}
                        placeholderTextColor="#999"
                    />
                </View>
                <TouchableOpacity style={styles.verifyBtn}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Verify</Text>
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    </LinearGradient>
  )
}

export default ResetPasswordScreen;

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20
    },
    verifyBtn: {
        backgroundColor: 'black',
        borderRadius: 5,
        width: 200,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 25,
    },
    input: {
        height: 50,
        color: '#333',
        fontSize: 14,
        padding: 10,
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
    }
})