import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function BottomNavigation({ navigation, currentRoute }) {
  const { isDark } = useTheme();

  const themeColors = {
    bg: isDark ? "#1E1E1E" : "#fff",
    text: isDark ? "#E0E0E0" : "#222",
    border: isDark ? "#555" : "#ddd",
    primary: "#7CC242",
  };

  const navItems = [
    { name: "Home", icon: "home-outline", route: "Home" },
    { name: "Alerts", icon: "notifications-outline", route: "Alerts"},
    { name: "", icon: "", route: "" }, // Placeholder for report button
    { name: "Map", icon: "map-outline", route: "MapScreen" },
    { name: "Profile", icon: "person-outline", route: "ProfilePage" },
  ];

  const isActive = (route) => currentRoute === route;

  return (
    <>
      <View style={[styles.bottomNav, { backgroundColor: themeColors.bg, borderTopColor: themeColors.border }]}>
        {navItems.map((item, index) => {
          // Empty space for the floating report button
          if (item.route === "") {
            return <View key={index} style={styles.navItem} />;
          }

          const active = isActive(item.route);

          return (
            <TouchableOpacity
              key={index}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={26}
                color={active ? themeColors.primary : themeColors.text}
              />
              <Text
                style={[
                  styles.navText,
                  { color: active ? themeColors.primary : themeColors.text }
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Report Button */}
      <TouchableOpacity
        style={styles.reportBtn}
        onPress={() => navigation.navigate("Report")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
bottomNav: {
  position: "absolute",
  bottom: 0,        
  left: 0,
  right: 0,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 11,
  borderTopWidth: 1,
  borderColor: "#ddd",
  backgroundColor: "#fff",
  height: 96,       
  zIndex: 100,
  paddingBottom: 43
},

  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: width * 0.03,
    marginTop: 4,
  },
  reportBtn: {
    position: "absolute",
    bottom: height * 0.04,
    left: width / 2 - width * 0.075,
    backgroundColor: "#7CC242",
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});