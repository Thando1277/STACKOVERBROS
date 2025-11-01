import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import {
  getAuth,
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";

import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext"; // ✅ Theme context



export default function EditProfile({ navigation }) {
  const { isDark } = useTheme(); // ✅ theme toggle
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isNewEmailFocused, setIsNewEmailFocused] = useState(false);
  const [isCurrentPasswordFocused, setIsCurrentPasswordFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) setCurrentEmail(user.email || "");
  }, [user]);

  const handleSaveChanges = async () => {
    if (!newEmail && !newPassword) {
      setErrorMessage("⚠️ Please enter a new email or password to update.");
      setShowErrorModal(true);
      return;
    }

    if (!currentPassword) {
      setErrorMessage("⚠️ Please enter your current password to make changes.");
      setShowErrorModal(true);
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        setErrorMessage("⚠️ Please fill in both new password fields.");
        setShowErrorModal(true);
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage("⚠️ New passwords do not match.");
        setShowErrorModal(true);
        return;
      }

      if (newPassword.length < 6) {
        setErrorMessage("⚠️ Password must be at least 6 characters long.");
        setShowErrorModal(true);
        return;
      }
    }

    if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
      setErrorMessage("⚠️ Please enter a valid email address.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      let updatedItems = [];

      // Update email first if provided
      if (newEmail && newEmail !== currentEmail) {
        try {
          // Try direct email update first
          await updateEmail(user, newEmail);
          
          // If successful, update Firestore
          const userId = user.uid;
          const userDocRef = doc(db, "users", userId);
          
          try {
            await updateDoc(userDocRef, { 
              email: newEmail,
              updatedAt: new Date().toISOString()
            });
          } catch (firestoreError) {
            console.log('Firestore update error, trying setDoc:', firestoreError);
            const userSnapshot = await getDoc(userDocRef);
            if (!userSnapshot.exists()) {
              await setDoc(userDocRef, {
                email: newEmail,
                fullname: user.displayName || "No Name",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
          
          setCurrentEmail(newEmail);
          updatedItems.push('email');
        } catch (emailError) {
          console.log('Email update error:', emailError.code, emailError.message);
          
          // Handle the specific "operation-not-allowed" error
          if (emailError.code === 'auth/operation-not-allowed') {
            // This means Firebase requires email verification
            // Update only in Firestore as a workaround
            const userId = user.uid;
            const userDocRef = doc(db, "users", userId);
            
            try {
              await updateDoc(userDocRef, { 
                pendingEmail: newEmail,
                updatedAt: new Date().toISOString()
              });
              
              setErrorMessage(
                '⚠️ Email verification is required by your Firebase settings.\n\n' +
                'To enable direct email updates:\n' +
                '1. Go to Firebase Console\n' +
                '2. Authentication → Settings → User account management\n' +
                '3. Disable "Email enumeration protection"\n\n' +
                (newPassword ? 'Your password has been updated successfully.' : 'Please try again after updating settings.')
              );
              setShowErrorModal(true);
              
              // Clear fields
              setNewEmail('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              
              return; // Exit early
            } catch (firestoreError) {
              console.error('Firestore error:', firestoreError);
              throw emailError; // Throw original error if Firestore also fails
            }
          } else {
            // For other errors, throw them normally
            throw emailError;
          }
        }
      }

      // Update password (if provided)
      if (newPassword) {
        await updatePassword(user, newPassword);
        updatedItems.push("password");
      }

      // Show appropriate success message
      if (updatedItems.includes('email') && updatedItems.includes('password')) {
        setSuccessMessage('✅ Email and password updated successfully!');
      } else if (updatedItems.includes('email')) {
        setSuccessMessage('✅ Email updated successfully!');
      } else if (updatedItems.includes('password')) {
        setSuccessMessage('✅ Password updated successfully!');
      } else {
        setSuccessMessage("✅ Profile updated successfully!");
      }

      setShowSuccessModal(true);
      setNewEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Update error:", error);
      let message = "❌ Failed to update profile. ";

      switch (error.code) {
        case "auth/wrong-password":
          message += "Current password is incorrect.";
          break;
        case "auth/weak-password":
          message += "New password is too weak.";
          break;
        case "auth/email-already-in-use":
          message += "This email is already in use.";
          break;
        case "auth/invalid-email":
          message += "Invalid email address.";
          break;
        case "auth/requires-recent-login":
          message += "Please log out and log in again first.";
          break;
        case 'auth/too-many-requests':
          message += 'Too many attempts. Please try again later.';
          break;
        case 'auth/operation-not-allowed':
          message += 'This operation is not allowed. Please check your Firebase settings.';
          break;
        default:
          message += error.message || "An unexpected error occurred.";
      }

      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    if (!currentPassword) {
      setErrorMessage("⚠️ Please enter your current password to delete your account.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore (optional but recommended)
      try {
        const userId = user.uid;
        await updateDoc(doc(db, "users", userId), { 
          deleted: true,
          deletedAt: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.log('Firestore cleanup error:', firestoreError);
        // Continue with auth deletion even if Firestore fails
      }

      // Delete user account from Firebase Authentication
      await deleteUser(user);

      setSuccessMessage("✅ Account deleted successfully! Redirecting...");
      setShowSuccessModal(true);

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "SignUp" }],
        });
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      let message = '❌ Failed to delete account. ';
      
      switch (error.code) {
        case "auth/wrong-password":
          message += "Current password is incorrect.";
          break;
        case "auth/requires-recent-login":
          message += "Please log out and log in again.";
          break;
        default:
          message += error.message;
      }
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Theme Colors
  const themeColors = {
    background: isDark ? "#1C1C1E" : "#FFFFFF",
    text: isDark ? "#EDEDED" : "#000000",
    inputBg: isDark ? "#2C2C2E" : "#FFFFFF",
    border: isDark ? "#555" : "#CCC",
    placeholder: isDark ? "#999" : "#777",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backButtonText, { color: "#7CC242" }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>Edit Profile</Text>

            <Text style={[styles.label, { color: themeColors.text }]}>Current Email</Text>
            <View style={[styles.emailContainer, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
              <Text style={[styles.emailText, { color: themeColors.text }]}>{currentEmail}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Update Email</Text>
            <Text style={[styles.label, { color: themeColors.text }]}>New Email (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: isNewEmailFocused ? "#7CC242" : themeColors.border, color: themeColors.text }]}
              placeholder="Enter new email"
              placeholderTextColor={themeColors.placeholder}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsNewEmailFocused(true)}
              onBlur={() => setIsNewEmailFocused(false)}
            />

            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Change Password</Text>
            <Text style={[styles.label, { color: themeColors.text }]}>Current Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: isCurrentPasswordFocused ? "#7CC242" : themeColors.border, color: themeColors.text }]}
              placeholder="Enter current password"
              placeholderTextColor={themeColors.placeholder}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsCurrentPasswordFocused(true)}
              onBlur={() => setIsCurrentPasswordFocused(false)}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>New Password (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: isPasswordFocused ? "#7CC242" : themeColors.border, color: themeColors.text }]}
              placeholder="Enter new password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: isConfirmFocused ? "#7CC242" : themeColors.border, color: themeColors.text }]}
              placeholder="Re-enter new password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setIsConfirmFocused(true)}
              onBlur={() => setIsConfirmFocused(false)}
            />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSaveChanges} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={loading}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  backButton: { padding: 15, position: "absolute", top: 20, left: 15, zIndex: 1 },
  backButtonText: { fontSize: 16, fontWeight: "600" },
  formContainer: { width: "100%", maxWidth: 350 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 25 },
  emailContainer: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 25 },
  emailText: { fontSize: 16 },
  sectionTitle: {fontSize: 18, fontWeight: "700", marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 16 },
  button: { backgroundColor: "#7CC242", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonDisabled: { backgroundColor: "#5a8f31" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deleteButton: { marginTop: 20, borderColor: "#e53935", borderWidth: 1, borderRadius: 8, padding: 15, alignItems: "center" },
  deleteButtonText: { color: "#e53935", fontWeight: "600", fontSize: 16 },
});
