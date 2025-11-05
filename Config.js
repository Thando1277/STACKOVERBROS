// Config.js - Secure configuration using environment variables
import Constants from 'expo-constants';

// Get environment variables safely
const getEnvVar = (key, fallback = null) => {
  // Try Expo Constants first (for production builds)
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  
  // Try process.env (for development with babel-plugin-inline-dotenv)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Use fallback or throw error
  if (fallback !== null) {
    return fallback;
  }
  
  throw new Error(`Environment variable ${key} is not defined. Please check your .env file or app.json configuration.`);
};

const Config = {
  // API URL from environment variables
  API_URL: getEnvVar('API_URL', 'http://localhost:5000'), // fallback to localhost
  
  // Add other configuration as needed
  // EXAMPLE: GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY'),
  // EXAMPLE: STRIPE_PUBLIC_KEY: getEnvVar('STRIPE_PUBLIC_KEY'),
};

export default Config;