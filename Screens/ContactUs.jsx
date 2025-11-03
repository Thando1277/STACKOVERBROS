import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from "@expo/vector-icons";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function ContactSupportScreen({ navigation }) {
  const { colors} = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isMessageFocused, setIsMessageFocused] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const handleSend = () => {
    setModalVisible(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={scale(28)} color="#7CC242" />
        </TouchableOpacity>
        <View style={{ width: scale(28) }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: '#7CC242' }]}>Contact Us</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>
                We’re here to help. Fill out the form below and our support team will respond shortly.
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { borderColor: isNameFocused ? '#7CC242' : '#444', color: colors.text, backgroundColor: colors.card },
                ]}
                placeholder="Your Name"
                placeholderTextColor={colors.subText}
                value={name}
                onChangeText={setName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />

              <TextInput
                style={[
                  styles.input,
                  { borderColor: isEmailFocused ? '#7CC242' : '#444', color: colors.text, backgroundColor: colors.card },
                ]}
                placeholder="Your Email"
                placeholderTextColor={colors.subText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.messageBox,
                  { borderColor: isMessageFocused ? '#7CC242' : '#444', color: colors.text, backgroundColor: colors.card },
                ]}
                placeholder="Your Message"
                placeholderTextColor={colors.subText}
                multiline
                value={message}
                onChangeText={setMessage}
                onFocus={() => setIsMessageFocused(true)}
                onBlur={() => setIsMessageFocused(false)}
              />

              <TouchableOpacity style={[styles.button, { backgroundColor: '#7CC242' }]} onPress={handleSend}>
                <Text style={[styles.buttonText, { color: colors.text }]}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={[styles.modalBackground, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: '#7CC242' }]}>Message Sent!</Text>
                <Text style={[styles.modalText, { color: colors.text }]}>
                  Thank you for reaching out. Our support team will respond shortly.
                </Text>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#7CC242' }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: { padding: 15, position: 'absolute', top: 10, left: 10, zIndex: 1 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 0 },
  formContainer: { width: '100%', maxWidth: 400 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, marginBottom: 15, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  messageBox: { height: 120, textAlignVertical: 'top' },
  button: { borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: '600' },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', borderRadius: 12, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderBottomWidth: 0.3,
  },
});
