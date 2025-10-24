// context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  // Load saved theme on start
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("isDark");
      if (saved !== null) setIsDark(JSON.parse(saved));
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem("isDark", JSON.stringify(newTheme));
    } catch (e) {
      console.warn("Failed to save theme", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
