import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { 
  getAuth, 
  updatePassword, 
  updateEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  deleteUser 
} from 'firebase/auth';

export default function EditProfile({ navigation }) {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Focus states for inputs
  const [isNewEmailFocused, setIsNewEmailFocused] = useState(false);
  const [isCurrentPasswordFocused, setIsCurrentPasswordFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    // Load current user email
    if (user) {
      setCurrentEmail(user.email || '');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    // Validate that at least one field is being updated
    if (!newEmail && !newPassword) {
      setErrorMessage('⚠️ Please enter a new email or password to update.');
      setShowErrorModal(true);
      return;
    }

    // Validate current password is entered
    if (!currentPassword) {
      setErrorMessage('⚠️ Please enter your current password to make changes.');
      setShowErrorModal(true);
      return;
    }

    // Validate password fields if user is changing password
    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        setErrorMessage('⚠️ Please fill in both new password fields.');
        setShowErrorModal(true);
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('⚠️ New passwords do not match.');
        setShowErrorModal(true);
        return;
      }

      if (newPassword.length < 6) {
        setErrorMessage('⚠️ Password must be at least 6 characters long.');
        setShowErrorModal(true);
        return;
      }
    }

    // Validate email format
    if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
      setErrorMessage('⚠️ Please enter a valid email address.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before making changes
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      let updatedItems = [];

      // Update email if provided
      if (newEmail && newEmail !== currentEmail) {
        try {
          // Use verifyBeforeUpdateEmail which sends verification to new email
          await verifyBeforeUpdateEmail(user, newEmail);
          updatedItems.push('email verification sent');
          
          setSuccessMessage(
            `A verification email has been sent to ${newEmail}. ` +
            `Please verify your new email address to complete the change. ` +
            `Your current email (${currentEmail}) will remain active until verification.`
          );
        } catch (emailError) {
          // If verifyBeforeUpdateEmail is not available, try direct update
          if (emailError.code === 'auth/operation-not-allowed') {
            // Try direct email update without verification
            await updateEmail(user, newEmail);
            setCurrentEmail(newEmail);
            updatedItems.push('email');
          } else {
            throw emailError;
          }
        }
      }

      // Update password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
        updatedItems.push('password');
      }

      // Only show success message if we haven't already shown the email verification message
      if (!updatedItems.includes('email verification sent')) {
        const message = updatedItems.length > 0 
          ? `${updatedItems.join(' and ')} updated successfully!`
          : 'No changes were made.';
        setSuccessMessage(message);
      }

      setShowSuccessModal(true);
      
      // Clear fields
      setNewEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      let message = 'Failed to update profile. ';
      
      switch (error.code) {
        case 'auth/wrong-password':
          message += 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          message += 'New password is too weak.';
          break;
        case 'auth/email-already-in-use':
          message += 'This email is already in use by another account.';
          break;
        case 'auth/invalid-email':
          message += 'The email address is invalid.';
          break;
        case 'auth/operation-not-allowed':
          message += 'Email update requires verification. Please check your Firebase settings or contact support.';
          break;
        case 'auth/requires-recent-login':
          message += 'Please log out and log in again before updating your profile.';
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

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

    // Check if current password is entered
    if (!currentPassword) {
      setErrorMessage('⚠️ Please enter your current password to delete your account.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate before deletion
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Delete user account from Firebase Authentication
      await deleteUser(user);

      setSuccessMessage('Account deleted successfully! Redirecting to login...');
      setShowSuccessModal(true);
      
      // Navigate to login after a delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignUp' }],
        });
      }, 2000);
    } catch (error) {
      let message = 'Failed to delete account. ';
      
      switch (error.code) {
        case 'auth/wrong-password':
          message += 'Current password is incorrect.';
          break;
        case 'auth/requires-recent-login':
          message += 'Please log out and log in again before deleting your account.';
          break;
        case 'auth/user-not-found':
          message += 'User account not found.';
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#121212' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Edit Profile</Text>

            {/* Current Email Display */}
            <Text style={styles.label}>Current Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{currentEmail}</Text>
            </View>

            {/* Update Email Section */}
            <Text style={styles.sectionTitle}>Update Email</Text>
            <Text style={styles.label}>New Email (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: isNewEmailFocused ? '' : '#555' },
              ]}
              placeholder="Enter new email"
              placeholderTextColor="#aaa"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setIsNewEmailFocused(true)}
              onBlur={() => setIsNewEmailFocused(false)}
            />

            {/* Update Password Section */}
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <Text style={styles.label}>Current Password (required)</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: isCurrentPasswordFocused ? '' : '#555' },
              ]}
              placeholder="Enter current password"
              placeholderTextColor="#aaa"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              onFocus={() => setIsCurrentPasswordFocused(true)}
              onBlur={() => setIsCurrentPasswordFocused(false)}
            />

            <Text style={styles.label}>New Password (optional)</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: isPasswordFocused ? '' : '#555' },
              ]}
              placeholder="Enter new password"
              placeholderTextColor="#aaa"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: isConfirmFocused ? '' : '#555' },
              ]}
              placeholder="Re-enter new password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setIsConfirmFocused(true)}
              onBlur={() => setIsConfirmFocused(false)}
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSaveChanges}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Confirmation Modal */}
          <Modal transparent visible={showDeleteModal} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Delete Account</Text>
                <Text style={styles.modalText}>
                  Are you sure you want to delete your account? This action cannot be undone.
                </Text>
                <Text style={styles.modalSubText}>
                  Please ensure you've entered your current password above to proceed.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteConfirmButton]}
                    onPress={confirmDelete}
                  >
                    <Text style={styles.deleteConfirmText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Success Modal */}
          <Modal transparent visible={showSuccessModal} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, styles.successBox]}>
                <Text style={styles.successTitle}>✅ Success</Text>
                <Text style={styles.successText}>{successMessage}</Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.successButton]}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.successButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Error Modal */}
          <Modal transparent visible={showErrorModal} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, styles.errorBox]}>
                <Text style={styles.errorTitle}>❌ Error</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.errorButton]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={styles.errorButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  backButton: {
    padding: 15,
    position: 'absolute',
    top: 20,
    left: 15,
    zIndex: 1,
  },
  backButtonText: {
    color: '#7CC242',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#fff',
  },
  emailContainer: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    marginBottom: 25,
    backgroundColor: '#2a2a2a',
  },
  emailText: {
    fontSize: 16,
    color: '#aaa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: '#7CC242',
    marginTop: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
  button: {
    backgroundColor: '#7CC242',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#5a8f31',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 20,
    borderColor: '#e53935',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#e53935',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e1e1e',
    width: 320,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#e53935',
  },
  modalText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
    marginRight: 10,
  },
  deleteConfirmButton: {
    backgroundColor: '#e53935',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  successBox: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
  },
  successButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorBox: {
    borderColor: '#e53935',
    borderWidth: 2,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e53935',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 25,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});