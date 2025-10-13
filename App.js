import React, { useState } from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DataProvider } from "./context/DataContext";

// Main Screens
import HomeScreen from "./Screens/HomeScreen";
import ReportScreen from "./Screens/ReportScreen";
import DetailsScreen from "./Screens/DetailsScreen";
import ChatbotScreen from "./Screens/ChatbotScreen";
import SignUp from "./Screens/SignUp";
import LogIn from "./Screens/LogIn";
import ProfilePage from "./Screens/ProfilePage";
import CommentsScreen from "./Screens/CommentsScreen";
import ResetPasswordScreen from "./Screens/ResetPasswordScreen";
import SettingsScreen from "./Screens/SettingsScreens";

// Settings Sub-Screens
import FAQScreen from "./Screens/FAQScreen";
import ContactUs from "./Screens/ContactUs";
import TermsPrivacyScreen from "./Screens/TermsPrivacyScreen";
import EditProfile from "./Screens/EditProfile";

const Stack = createNativeStackNavigator();

export default function App() {
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <DataProvider>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            initialRouteName="SignUp"
            screenOptions={{ headerShown: false }}
          >
            {/* 🔐 Authentication Screens */}
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="LogIn" component={LogIn} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

            {/* 🏠 Main App Screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
            <Stack.Screen name="ProfilePage" component={ProfilePage} />
            <Stack.Screen name="Comments" component={CommentsScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

            {/* ⚙️ Settings Sub-Screens */}
            <Stack.Screen name="FAQScreen" component={FAQScreen} />
            <Stack.Screen name="ContactUs" component={ContactUs} />
            <Stack.Screen
              name="TermsPrivacyScreen"
              component={TermsPrivacyScreen}
            />
            <Stack.Screen name="EditProfile" component={EditProfile} />
          </Stack.Navigator>

          {/* 💬 Floating Chat Button */}
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

          {/* 🤖 Chatbot Modal */}
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
