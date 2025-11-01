import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function FAQScreen({ navigation }) {
  const { colors } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const faqs = [
    { question: "How do I reset my password?", answer: "Go to Edit Profile → Change Password → Save." },
    { question: "How do I change my password?", answer: "Go to Edit Profile → Change Password → Enter new password → Save." },
    { question: "How do I contact support?", answer: "You can use the Contact Support option in Settings." },
    { question: "How do I post a missing person/pet?", answer: "Go to the Report screen → Select Missing Person or Pet → Fill in details → Submit." },
    { question: "Is my data safe?", answer: "Yes. We value your privacy and comply with data protection standards." },
  ];

  const handlePress = (answer) => {
    setSelectedAnswer(answer);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={[styles.backButtonText, { color: "#7CC242" }]}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>FAQ / Help Center</Text>

        {faqs.map((faq, index) => (
          <TouchableOpacity key={index} style={[styles.item, { backgroundColor: colors.card }]} onPress={() => handlePress(faq.answer)}>
            <Text style={[styles.question, { color: "#7CC242" }]}>Q: {faq.question}</Text>
            <Text style={[styles.answer, { color: colors.subText }]}>A: {faq.answer}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: "#7CC242" }]}>Answer</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>{selectedAnswer}</Text>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#7CC242" }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: 15, position: "absolute", top: 50, left: 15, zIndex: 10 },
  backButtonText: { fontSize: 16, fontWeight: "600" },
  scroll: { padding: 20, paddingTop: 100 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  item: { marginBottom: 15, padding: 12, borderRadius: 8 },
  question: { fontSize: 16, fontWeight: "600" },
  answer: { fontSize: 15, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBox: { borderRadius: 12, padding: 20, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  modalText: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
});
