import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SuccessCheck = forwardRef((props, ref) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    play() {
      opacity.setValue(0);
      scale.setValue(0.4);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.4, duration: 180, useNativeDriver: true }),
          ]).start();
        }, 700);
      });
    },
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.bubble, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={54} color="#fff" />
      </Animated.View>
    </Animated.View>
  );
});

export default SuccessCheck;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  bubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#7CC242",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});
