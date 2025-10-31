import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";

export default function SmartChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
  if (!input.trim()) return;
  const userMsg = { from: "user", text: input };
  setMessages([...messages, userMsg]);
  setInput("");
  setLoading(true);

  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      { inputs: input },
      { headers: { Authorization: "Bearer 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" } }
    );

    const botMsg = {
      from: "bot",
      text: res.data[0]?.generated_text || "Hmm... I'm not sure about that 🤔",
    };
    setMessages((prev) => [...prev, botMsg]);
  } catch (e) {
    console.error(e);
    setMessages((prev) => [...prev, { from: "bot", text: "Error connecting to AI 😞" }]);
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.chatArea}>
        {messages.map((m, i) => (
          <Text
            key={i}
            style={[
              styles.message,
              m.from === "user" ? styles.userMsg : styles.botMsg,
            ]}
          >
            {m.text}
          </Text>
        ))}
        {loading && <ActivityIndicator size="small" color="gray" />}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  chatArea: { flexGrow: 1, justifyContent: "flex-end" },
  message: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    maxWidth: "80%",
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  botMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#EAEAEA",
  },
  inputArea: { flexDirection: "row", marginTop: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
});
