// context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("isDark");
        if (saved !== null) setIsDark(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load saved theme:", e);
      }
    })();
  }, []);

  // Toggle theme and persist it
  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem("isDark", JSON.stringify(newTheme));
    } catch (e) {
      console.warn("Failed to save theme:", e);
    }
  };

  // Define color palettes
  const lightColors = {
    background: "#FFFFFF",
    card: "#F8F9FA",
    text: "#1A1A1A",
    subText: "#666666",
    primary: "#007AFF", // iOS blue
  };

  const darkColors = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    subText: "#AAAAAA",
    primary: "#0A84FF",
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
