import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PersonCard({ person }) {
  return (
    <View style={[styles.card, { backgroundColor: "#A78BFA" }]}>
      <Text style={styles.name}>{person.name}</Text>
      <Text>Age: {person.age}</Text>
      <Text>Gender: {person.gender}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "bold" },
});
