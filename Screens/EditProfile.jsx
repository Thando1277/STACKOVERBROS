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
  Alert,
  Dimensions
} from "react-native";

import {
  getAuth,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";

import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext"; // ✅ Theme context
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function EditProfile({ navigation }) {
  const { isDark } = useTheme(); // ✅ theme toggle
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
          await updateEmail(user, newEmail);

          const userId = user.uid;
          const userDocRef = doc(db, "users", userId);

          try {
            await updateDoc(userDocRef, {
              email: newEmail,
              updatedAt: new Date().toISOString(),
            });
          } catch (firestoreError) {
            const userSnapshot = await getDoc(userDocRef);
            if (!userSnapshot.exists()) {
              await setDoc(userDocRef, {
                email: newEmail,
                fullname: user.displayName || "No Name",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }

          setCurrentEmail(newEmail);
          updatedItems.push("email");
        } catch (emailError) {
          console.log("Email update error:", emailError);
          throw emailError;
        }
      }

      // Update password (if provided)
      if (newPassword) {
        await updatePassword(user, newPassword);
        updatedItems.push("password");
      }

      // Show success message
      if (updatedItems.includes("email") && updatedItems.includes("password")) {
        setSuccessMessage("✅ Email and password updated successfully!");
      } else if (updatedItems.includes("email")) {
        setSuccessMessage("✅ Email updated successfully!");
      } else if (updatedItems.includes("password")) {
        setSuccessMessage("✅ Password updated successfully!");
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
        default:
          message += error.message || "An unexpected error occurred.";
      }

      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    if (!currentPassword) {
      setErrorMessage("⚠️ Please enter your current password to delete your account.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);

      // Password is correct, ask for confirmation
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to permanently delete your account?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
          {
            text: "Yes, Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const userId = user.uid;
                await updateDoc(doc(db, "users", userId), {
                  deleted: true,
                  deletedAt: new Date().toISOString(),
                });

                await deleteUser(user);

                setSuccessMessage("✅ Account deleted successfully! Redirecting...");
                setShowSuccessModal(true);

                setTimeout(() => {
                  navigation.replace("LogIn");
                }, 1500);
              } catch (error) {
                console.error("Delete error:", error);
                setErrorMessage("❌ Failed to delete account: " + (error.message || ""));
                setShowErrorModal(true);
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/wrong-password") {
        setErrorMessage("❌ Current password is incorrect.");
      } else {
        setErrorMessage("❌ Unable to verify password: " + (error.message || ""));
      }
      setShowErrorModal(true);
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

      {/* Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={scale(28)} color="#7CC242" />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
        >

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

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "#4BB543", fontSize: 16, fontWeight: "600", textAlign: "center" }}>{successMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "#e53935", fontSize: 16, fontWeight: "600", textAlign: "center" }}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowErrorModal(false)}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 16 },
  button: { backgroundColor: "#7CC242", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonDisabled: { backgroundColor: "#5a8f31" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deleteButton: { marginTop: 20, borderColor: "#e53935", borderWidth: 1, borderRadius: 8, padding: 15, alignItems: "center" },
  deleteButtonText: { color: "#e53935", fontWeight: "600", fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%", alignItems: "center" },
  modalButton: { marginTop: 15, backgroundColor: "#7CC242", padding: 10, borderRadius: 6, alignItems: "center", width: "100%" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderBottomWidth: 0.3,
  },
});
