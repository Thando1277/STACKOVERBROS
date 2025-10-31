import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from "@expo/vector-icons";


export default function FAQScreen({ navigation }) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Edit Profile → Change Password → Save.',
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Edit Profile → Change Password → Enter new password → Save.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can use the Contact Support option in Settings.',
    },
    {
      question: 'How do I post a missing person/pet?',
      answer: 'Go to the Report screen → Select Missing Person or Pet → Fill in details → Submit.',
    },
    {
      question: 'Is my data safe?',
      answer: 'Yes. We value your privacy and comply with data protection standards.',
    },
  ];

  const handlePress = (answer) => {
    setSelectedAnswer(answer);
    setModalVisible(true);
  };

  return (

    <>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#7CC242" />
      </TouchableOpacity>

      <View style={styles.container}>
      {/* Back Button */}
      

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>FAQ / Help Center</Text>

        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={() => handlePress(faq.answer)}
          >
            <Text style={styles.question}>Q: {faq.question}</Text>
            <Text style={styles.answer}>A: {faq.answer}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Answer</Text>
            <Text style={styles.modalText}>{selectedAnswer}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
  },
  backButtonText: {
    color: '#7CC242',
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    paddingTop: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  item: {
    marginBottom: 15,
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7CC242',
  },
  answer: {
    fontSize: 15,
    color: '#ccc',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7CC242',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#7CC242',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
