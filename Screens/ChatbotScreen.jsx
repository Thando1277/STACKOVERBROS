// ChatbotScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
 
      
export default function ChatbotScreen() {
  const html = `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <script src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"></script>
      <style>
        /* make df-messenger fill the viewport */
        html, body, #chat { height: 100%; margin: 0; padding: 0; }
        df-messenger { height: 100%; }
      </style>
    </head>
    <body>
      <div id="chat">
        <df-messenger
            chat-title="Botman💡"
            agent-id="56c2497a-867e-41d0-bd80-0c488729855b"
            language-code="en"
            expand="true"
        ></df-messenger>
      </div>
    </body>
  </html>`;


  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://www.gstatic.com/" }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"   
        style={{ flex: 1 }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
});
