import React, { useRef } from "react";
import { View, Text, Pressable, Image, Animated, PanResponder } from "react-native";
import type { ThemeColors } from "../theme";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onFlag: () => void;
  colors: ThemeColors;
}

const ACTION_WIDTH = 140;

export function SwipeableRow({ children, onDelete, onFlag, colors }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          startX.current = v;
        });
      },
      onPanResponderMove: (_, gs) => {
        const next = Math.min(
          0,
          Math.max(-ACTION_WIDTH, startX.current + gs.dx)
        );
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const dest = gs.dx < -40 ? -ACTION_WIDTH : 0;
        startX.current = dest;
        Animated.spring(translateX, {
          toValue: dest,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      },
    })
  ).current;

  const close = () => {
    startX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  return (
    <View style={{ marginBottom: 10, overflow: "hidden", borderRadius: 14 }}>
      {/* Action buttons behind */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: ACTION_WIDTH,
          flexDirection: "row",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <Pressable
          onPress={() => {
            close();
            onFlag();
          }}
          style={{
            flex: 1,
            backgroundColor: colors.warmAmber,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../assets/flag-icon.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={{
            flex: 1,
            backgroundColor: colors.danger,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}
          >
            Delete
          </Text>
        </Pressable>
      </View>
      {/* Row content (slides left) — opaque bg covers actions when not swiped */}
      <Animated.View
        style={{
          transform: [{ translateX }],
          backgroundColor: colors.cream,
          borderRadius: 14,
        }}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}
