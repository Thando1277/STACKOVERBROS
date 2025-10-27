import React, { useRef } from "react";
import { Animated, PanResponder, TouchableOpacity } from "react-native";

const DraggableIcon = ({ children, startX = 300, startY = 600, onPress }) => {
  const position = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start pan if the user moves more than a tiny threshold
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        position.setOffset({
          x: position.x._value,
          y: position.y._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        position.flattenOffset();

        // If the drag distance is tiny, treat it as a tap
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          onPress && onPress();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: "absolute",
          zIndex: 100,
        },
        { transform: position.getTranslateTransform() },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default DraggableIcon;
