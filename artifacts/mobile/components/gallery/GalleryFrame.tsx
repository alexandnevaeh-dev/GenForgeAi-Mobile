import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface GalleryFrameProps {
  children: React.ReactNode;
  color: string;
  cornerSize?: number;
  cornerThickness?: number;
  style?: ViewStyle;
}

function CornerAccent({
  color,
  size,
  thickness,
  top,
  right,
  bottom,
  left,
}: {
  color: string;
  size: number;
  thickness: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}) {
  const isTop = top !== undefined;
  const isLeft = left !== undefined;
  return (
    <View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderColor: color,
          opacity: 0.7,
        },
        top !== undefined && { top },
        right !== undefined && { right },
        bottom !== undefined && { bottom },
        left !== undefined && { left },
        // Determine which borders to show based on corner position
        isTop && isLeft
          ? { borderTopWidth: thickness, borderLeftWidth: thickness }
          : isTop && !isLeft
          ? { borderTopWidth: thickness, borderRightWidth: thickness }
          : !isTop && isLeft
          ? { borderBottomWidth: thickness, borderLeftWidth: thickness }
          : { borderBottomWidth: thickness, borderRightWidth: thickness },
      ]}
    />
  );
}

export function GalleryFrame({
  children,
  color,
  cornerSize = 12,
  cornerThickness = 2,
  style,
}: GalleryFrameProps) {
  return (
    <View style={[styles.wrap, style]}>
      {children}
      <CornerAccent color={color} size={cornerSize} thickness={cornerThickness} top={0} left={0} />
      <CornerAccent color={color} size={cornerSize} thickness={cornerThickness} top={0} right={0} />
      <CornerAccent color={color} size={cornerSize} thickness={cornerThickness} bottom={0} left={0} />
      <CornerAccent color={color} size={cornerSize} thickness={cornerThickness} bottom={0} right={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
});
