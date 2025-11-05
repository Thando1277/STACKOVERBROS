# STACKOVERBROS

A React Native application with secure environment variable configuration.

## 🔒 Security Setup

This repository uses environment variables to keep sensitive information (API keys, configuration) separate from the codebase. This allows the repository to be safely made public.

### For Development Setup:

1. **Create your local environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values in `.env`:**
   ```bash
   # Firebase Configuration
   FIREBASE_API_KEY=AIzaSyDM9ajCTkROObUtA4QM8V6J9zRWSV964HY
   FIREBASE_AUTH_DOMAIN=findsos.firebaseapp.com
   FIREBASE_PROJECT_ID=findsos
   FIREBASE_STORAGE_BUCKET=findsos.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=633214674311
   FIREBASE_APP_ID=1:633214674311:web:981141b66deac72c995f22
   FIREBASE_MEASUREMENT_ID=G-77M5D3DF0R
   
   # API Configuration
   API_URL=http://YOUR_LOCAL_IP:5000
   ```

3. **Install dependencies for environment variable support:**
   ```bash
   npm install babel-plugin-inline-dotenv
   ```

4. **Update your `babel.config.js` (if not already done):**
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: ['inline-dotenv']
     };
   };
   ```

### For Production/Deployment:

Add your environment variables to your `app.json` in the `extra` field:

```json
{
  "expo": {
    "extra": {
      "FIREBASE_API_KEY": "your_actual_api_key",
      "FIREBASE_AUTH_DOMAIN": "your_project.firebaseapp.com",
      "FIREBASE_PROJECT_ID": "your_project_id",
      "FIREBASE_STORAGE_BUCKET": "your_project.firebasestorage.app",
      "FIREBASE_MESSAGING_SENDER_ID": "your_messaging_sender_id",
      "FIREBASE_APP_ID": "your_app_id",
      "FIREBASE_MEASUREMENT_ID": "your_measurement_id",
      "API_URL": "https://your-production-api.com"
    }
  }
}
```

## 📂 Project Structure

- `Firebase/firebaseConfig.js` - Secure Firebase configuration using environment variables
- `Config.js` - Application configuration using environment variables
- `.env.example` - Template for environment variables
- `.env` - Your local environment variables (not committed to git)

## 🚀 Getting Started

1. Clone the repository
2. Follow the security setup steps above
3. Install dependencies: `npm install`
4. Start the development server: `npm start`

## ⚠️ Important Security Notes

- **Never commit `.env` files to version control**
- **Never commit files containing actual API keys**
- **Always use the `.env.example` file as a template**
- **For production, use secure environment variable injection methods**

## 👥 For Lecturers/Reviewers

This repository is now safe to be public. All sensitive information has been moved to environment variables. To run the project:

1. Contact the developer for the actual environment variable values
2. Create a `.env` file with the provided values
3. Follow the setup instructions above

Alternatively, the developer can provide you with a pre-configured version for review purposes.