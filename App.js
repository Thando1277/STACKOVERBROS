import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from './Screens/SignUp';
import LogIn from './Screens/LogIn';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='SignUp' screenOptions={{ headerShown: false}}>
        <Stack.Screen name="SignUp" component={SignUp}/>
        <Stack.Screen name="LogIn" component={LogIn}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
