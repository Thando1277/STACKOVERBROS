// EnhancedChatBot.js
import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, Button, StatusBar, Text, ScrollView, ActivityIndicator, TouchableOpacity} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EnhancedChatBot({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState(null);
  const [awaitingDeleteType, setAwaitingDeleteType] = useState(false);

  const scrollRef = useRef();

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (awaitingDeleteType) {
      handleDeleteFollowUp(input);
    } else {
      botReply(input);
    }
  };

  const botReply = (msg) => {
    setLoading(true);
    setTimeout(() => {
      const reply = getBotResponse(msg);
      const botMsg = { from: "bot", text: reply };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 800 + Math.random() * 700); // typing delay
  };

  const handleDeleteFollowUp = (msg) => {
    const text = msg.toLowerCase();
    let reply = "";

    if (text.includes("report")) {
      reply = "Okay, to dlete a report, please go to Profile and under your Reports section, click the report you wish to remove and click the Delete report button at the bottom of the report.";
      setAwaitingDeleteType(false);
    } else if (text.includes("profile")) {
      reply = "Ok, to delete your Profile, go to the Profile tab and click the settings icon at the top. Scroll down until you see Edit Profile under Account & Profile Management and click on it, click on the Delete Account button at the bottom .We're sorry to see you go 😢";
      setAwaitingDeleteType(false);
    } else {
      reply = "I didn't understand. Please reply with 'report' or 'profile'.";
    }

    setMessages((prev) => [...prev, { from: "bot", text: reply }]);
  };

  const getBotResponse = (msg) => {
    const text = msg.toLowerCase();

    // Delete / Remove detection
    if (text.includes("delete") || text.includes("remove")) {
      setAwaitingDeleteType(true);
      return "Do you want to remove a Report or your Profile?";
    }

    // Remember user's name
    if (text.includes("my name is")) {
      const name = text.split("my name is")[1].trim().split(" ")[0];
      setUserName(name);
      return `Nice to meet you, ${name}! 👋`;
    }

    // Greetings
    if (text.includes("hello") || text.includes("hi"))
      return `Hi${userName ? ` ${userName}` : ""}! How can I help you today?`;
    if (text.includes("how are you")) return "I'm doing great, thanks for asking! 😄";

    // Info about app
    if (text.includes("what can you do") || text.includes("what is your name"))
      return "I am a ChatBot that helps with missing persons/pets reports, alerts, and more.";

    // Help
    if (text.includes("help") || text.includes("assistance") || text.includes("assist"))
      return "Sure! What do you need help with? You can ask about reporting missing persons/pets, alerts, or adoption.";

    // Reporting
    if (text.includes("missing") || text.includes("report"))
      return "To report a missing person or pet, please click on the '+' on your bottom tab to create a new report.";
    if (text.includes("found"))
      return "If you found someone or a pet, go to the home tab, click on the specific report and reply privately to the reporter or leave a comment.";
    if (text.includes("pet"))
      return "You can browse available pets in the Adoption tab if you want to help or adopt.";

    // Alerts
    if (text.includes("alert") || text.includes("emergency") || text.includes("crime") || text.includes("urgent") || text.includes("danger"))
      return "To set up an alert for a specific type of report, go to the Panic tab and create a new alert.";

    // Polite responses
    if (text.includes("thank you") || text.includes("thanks")) return "You're welcome! 😊";
    if (text.includes("bye") || text.includes("goodbye")) return "Goodbye! Have a great day! 👋";

    // Random fallback responses
    const fallbackReplies = [
      "Hmm... can you explain that differently? 🤔",
      "Interesting! Tell me more.",
      "I’m not sure I understand that completely 😅",
      "Can you give me more details?",
      "That's new information! 😎",
    ];
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  };

  useEffect(() => {
    // scroll to bottom whenever messages change
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
  <View style={{ flex: 1 }}>
    <StatusBar barStyle="light-content" backgroundColor="#8f8d8dff"/>
    {/* Header */}
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#8f8d8dff", // dark background
      paddingVertical: 12,
      paddingHorizontal: 10,
      paddingTop: StatusBar.currentHeight + 3,
    }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
        <Icon name="chevron-left" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Back</Text>
    </View>

    {/* Chat content */}
    <View style={{ flex: 1, padding: 20 }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((m, i) => (
          <Text
            key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              backgroundColor: m.from === "user" ? "#DCF8C6" : "#EAEAEA",
              borderRadius: 10,
              padding: 10,
              marginVertical: 4,
              maxWidth: "80%",
            }}
          >
            {m.text}
          </Text>
        ))}
        {loading && <ActivityIndicator size="small" color="gray" />}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#0d8b42ff",
            borderRadius: 8,
            padding: 10,
            margin: 5,
            height: 40,
          }}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={{ justifyContent: "center", marginLeft: 5, padding: 10, borderRadius: 8, marginBottom: 5, backgroundColor: "#0d8b42ff" }}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

}
