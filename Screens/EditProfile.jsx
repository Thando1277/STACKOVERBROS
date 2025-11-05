import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Header from '../components/Header';

export default function EditProfile({ navigation }) {
  const { isDark } = useTheme();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) setCurrentEmail(user.email || "");
  }, [user]);

  // Update Email Only
  const handleUpdateEmail = async () => {
    if (!newEmail) {
      setErrorMessage("Please enter a new email address.");
      setShowErrorModal(true);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setErrorMessage("Please enter a valid email address.");
      setShowErrorModal(true);
      return;
    }

    if (!currentPasswordForEmail) {
      setErrorMessage("Please enter your current password.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordForEmail);
      await reauthenticateWithCredential(user, credential);
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
      setSuccessMessage("Email updated successfully!");
      setShowSuccessModal(true);
      setNewEmail("");
      setCurrentPasswordForEmail("");
    } catch (error) {
      // Suppress console error
      let message = "Failed to update email. ";

      switch (error.code) {
        case "auth/wrong-password":
          message += "Current password is incorrect.";
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
          message += "An unexpected error occurred.";
      }

      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Update Password Only
  const handleUpdatePassword = async () => {
    if (!currentPasswordForPassword) {
      setErrorMessage("Please enter your current password.");
      setShowErrorModal(true);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in both new password fields.");
      setShowErrorModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      setShowErrorModal(true);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordForPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setSuccessMessage("Password updated successfully!");
      setShowSuccessModal(true);
      setCurrentPasswordForPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Suppress console error
      let message = "Failed to update password. ";

      switch (error.code) {
        case "auth/wrong-password":
          message += "Current password is incorrect.";
          break;
        case "auth/weak-password":
          message += "New password is too weak.";
          break;
        case "auth/requires-recent-login":
          message += "Please log out and log in again first.";
          break;
        default:
          message += "An unexpected error occurred.";
      }

      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Confirm Delete Account
  const confirmDeleteAccount = async () => {
    if (!deletePasswordInput) {
      setErrorMessage("Please enter your password to confirm deletion.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setShowDeleteModal(false);

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePasswordInput);
      await reauthenticateWithCredential(user, credential);

      const userId = user.uid;
      await updateDoc(doc(db, "users", userId), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      });

      await deleteUser(user);

      setSuccessMessage("Account deleted successfully!");
      setShowSuccessModal(true);
      setDeletePasswordInput("");

      setTimeout(() => {
        navigation.replace("LogIn");
      }, 1500);
    } catch (error) {
      // Suppress console error
      if (error.code === "auth/wrong-password") {
        setErrorMessage("Current password is incorrect.");
      } else {
        setErrorMessage("Failed to delete account. Please try again.");
      }
      setShowErrorModal(true);
      setDeletePasswordInput("");
    } finally {
      setLoading(false);
    }
  };

  const themeColors = {
    background: isDark ? "#1C1C1E" : "#F5F5F7",
    cardBg: isDark ? "#2C2C2E" : "#FFFFFF",
    text: isDark ? "#EDEDED" : "#1A1A1A",
    textSecondary: isDark ? "#999" : "#666",
    inputBg: isDark ? "#3A3A3C" : "#FFFFFF",
    border: isDark ? "#3A3A3C" : "#E0E0E0",
    placeholder: isDark ? "#666" : "#999",
    modalBg: isDark ? "#2C2C2E" : "#FFFFFF",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header navigation={navigation} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={[styles.title, { color: themeColors.text }]}>Edit Profile</Text>

          {/* Current Email Display */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
            <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
              CURRENT EMAIL
            </Text>
            <Text style={[styles.emailText, { color: themeColors.text }]}>
              {currentEmail}
            </Text>
          </View>

          {/* Update Email Section */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail-outline" size={18} color="#7CC242" />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Update Email
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: focusedField === 'newEmail' ? "#7CC242" : themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="New email"
              placeholderTextColor={themeColors.placeholder}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('newEmail')}
              onBlur={() => setFocusedField(null)}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: focusedField === 'currentPasswordEmail' ? "#7CC242" : themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Current password"
              placeholderTextColor={themeColors.placeholder}
              value={currentPasswordForEmail}
              onChangeText={setCurrentPasswordForEmail}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('currentPasswordEmail')}
              onBlur={() => setFocusedField(null)}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdateEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Update Email</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Change Password Section */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={18} color="#7CC242" />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Change Password
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: focusedField === 'currentPasswordPassword' ? "#7CC242" : themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Current password"
              placeholderTextColor={themeColors.placeholder}
              value={currentPasswordForPassword}
              onChangeText={setCurrentPasswordForPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('currentPasswordPassword')}
              onBlur={() => setFocusedField(null)}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: focusedField === 'newPassword' ? "#7CC242" : themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="New password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('newPassword')}
              onBlur={() => setFocusedField(null)}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: focusedField === 'confirmPassword' ? "#7CC242" : themeColors.border,
                  color: themeColors.text
                }
              ]}
              placeholder="Confirm new password"
              placeholderTextColor={themeColors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Delete Account Section */}
          <View style={[styles.card, styles.dangerCard, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={18} color="#e53935" />
              <Text style={[styles.sectionTitle, { color: "#e53935" }]}>
                Delete Account
              </Text>
            </View>

            <Text style={[styles.warningText, { color: themeColors.textSecondary }]}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={openDeleteModal}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <View style={[styles.deleteModalContent, { backgroundColor: themeColors.modalBg }]}>
                  <Ionicons name="warning" size={50} color="#e53935" />
                  <Text style={[styles.deleteModalTitle, { color: themeColors.text }]}>
                    Delete Account?
                  </Text>
                  <Text style={[styles.deleteModalMessage, { color: themeColors.textSecondary }]}>
                    Enter your password to confirm account deletion. This action cannot be undone.
                  </Text>

                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: themeColors.inputBg,
                        borderColor: themeColors.border,
                        color: themeColors.text
                      }
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={themeColors.placeholder}
                    value={deletePasswordInput}
                    onChangeText={setDeletePasswordInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowDeleteModal(false);
                        setDeletePasswordInput("");
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmDeleteButton]}
                      onPress={confirmDeleteAccount}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.modalBg }]}>
            <Ionicons name="checkmark-circle" size={48} color="#4BB543" />
            <Text style={[styles.modalText, { color: themeColors.text }]}>
              {successMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalOkButton, { backgroundColor: "#7CC242" }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.modalBg }]}>
            <Ionicons name="alert-circle" size={48} color="#e53935" />
            <Text style={[styles.modalText, { color: themeColors.text }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalOkButton, { backgroundColor: "#7CC242" }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#e53935",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#7CC242",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#5a8f31",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: 4,
    borderColor: "#e53935",
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#e53935",
    fontWeight: "600",
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalOkButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  deleteModalContent: {
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxWidth: "90%",
    alignItems: "center",
    marginBottom: 60, // INCREASED MARGIN BOTTOM HERE
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmDeleteButton: {
    backgroundColor: "#e53935",
  },
  confirmDeleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
