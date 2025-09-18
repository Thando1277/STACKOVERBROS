import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PetCard({ pet }) {
  return (
    <View style={[styles.card, { backgroundColor: "#60A5FA" }]}>
      <Text style={styles.name}>{pet.name}</Text>
      <Text>Age: {pet.age}</Text>
      <Text>Gender: {pet.gender}</Text>
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
