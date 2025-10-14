import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase/firebaseConfig";
import { DataProvider } from "./context/DataContext.jsx";

// Main Screens
import HomeScreen from "./Screens/HomeScreen.jsx";
import ReportScreen from "./Screens/ReportScreen.jsx";
import DetailsScreen from "./Screens/DetailsScreen.jsx";
import ChatbotScreen from "./Screens/ChatbotScreen.jsx";
import SignUp from "./Screens/SignUp.jsx";
import LogIn from "./Screens/LogIn.jsx";
import ProfilePage from "./Screens/ProfilePage.jsx";
import CommentsScreen from "./Screens/CommentsScreen.jsx";
import ResetPasswordScreen from "./Screens/ResetPasswordScreen.jsx";
import SettingsScreen from "./Screens/SettingsScreens.jsx";

// Settings Sub-Screens
import FAQScreen from "./Screens/FAQScreen.jsx";
import ContactUs from "./Screens/ContactUs.jsx";
import TermsPrivacyScreen from "./Screens/TermsPrivacyScreen.jsx";
import EditProfile from "./Screens/EditProfile.jsx";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current user:", currentUser ? currentUser.email : "None");
      setUser(currentUser);
      setLoading(false); // ✅ Only render screens after Firebase is ready
    });

    return unsubscribe;
  }, []);

  if (loading) {
    // ✅ Show this while waiting for Firebase to restore the session
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0FC436" />
      </View>
    );
  }

  return (
    <DataProvider>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            initialRouteName={user ? "Home" : "LogIn"} // ✅ Automatically redirect
            screenOptions={{ headerShown: false }}
          >
            {/* Auth */}
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="LogIn" component={LogIn} />

            {/* Main */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="Comments" component={CommentsScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

            {/* Settings Sub-Screens */}
            <Stack.Screen name="FAQScreen" component={FAQScreen} />
            <Stack.Screen name="ContactUs" component={ContactUs} />
            <Stack.Screen name="TermsPrivacyScreen" component={TermsPrivacyScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
          </Stack.Navigator>

          {/* Floating Chat Button */}
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              backgroundColor: "#7CC242",
              padding: 16,
              borderRadius: 50,
              elevation: 4,
              marginBottom: 65,
            }}
            onPress={() => setChatVisible(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Chatbot Modal */}
          <Modal visible={chatVisible} animationType="slide">
            <ChatbotScreen />
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 40,
                right: 20,
                backgroundColor: "#222",
                padding: 10,
                borderRadius: 20,
              }}
              onPress={() => setChatVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </Modal>
        </View>
      </NavigationContainer>
    </DataProvider>
  );
}
