import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, memo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path, Rect, G } from "react-native-svg";

import { theme } from "@/constants/theme";
import { ParticleEngine } from "./ParticleEngine";

const LAYER_W = 440;
const LAYER_H = 320;

function CastleSilhouette() {
  const c = theme.silhouette.dark;
  return (
    <Svg width={LAYER_W} height={LAYER_H} viewBox={`0 0 ${LAYER_W} ${LAYER_H}`}>
      <G>
        {/* Left tower body */}
        <Rect x={38} y={90} width={72} height={230} fill={c} />
        {/* Left tower battlements */}
        <Rect x={38} y={70} width={13} height={24} fill={c} />
        <Rect x={55} y={70} width={13} height={24} fill={c} />
        <Rect x={72} y={70} width={13} height={24} fill={c} />
        <Rect x={89} y={70} width={13} height={24} fill={c} />

        {/* Right tower body */}
        <Rect x={330} y={110} width={72} height={210} fill={c} />
        {/* Right tower battlements */}
        <Rect x={330} y={90} width={13} height={24} fill={c} />
        <Rect x={347} y={90} width={13} height={24} fill={c} />
        <Rect x={364} y={90} width={13} height={24} fill={c} />
        <Rect x={381} y={90} width={13} height={24} fill={c} />

        {/* Center spire */}
        <Rect x={200} y={55} width={40} height={265} fill={c} />
        {/* Spire battlements */}
        <Rect x={196} y={40} width={11} height={18} fill={c} />
        <Rect x={210} y={36} width={11} height={22} fill={c} />
        <Rect x={224} y={36} width={11} height={22} fill={c} />
        <Rect x={238} y={40} width={11} height={18} fill={c} />

        {/* Left wall */}
        <Rect x={110} y={180} width={90} height={140} fill={c} />
        {/* Right wall */}
        <Rect x={240} y={190} width={90} height={130} fill={c} />

        {/* Gate arch (two pillars + gap) */}
        <Rect x={168} y={240} width={20} height={80} fill={c} />
        <Rect x={252} y={240} width={20} height={80} fill={c} />
      </G>
    </Svg>
  );
}

function MountainSilhouette() {
  const c = theme.silhouette.mid;
  const pathD =
    "M 0,320 L 40,240 L 90,270 L 150,180 L 210,230 L 260,140 L 310,200 L 355,160 L 400,190 L 440,150 L 440,320 Z";
  return (
    <Svg width={LAYER_W} height={LAYER_H} viewBox={`0 0 ${LAYER_W} ${LAYER_H}`}>
      <Path d={pathD} fill={c} />
    </Svg>
  );
}

function ForegroundTrees() {
  const c = "#020208";
  const trunks: Array<[number, number, number]> = [
    [0, 260, 60],
    [50, 240, 55],
    [380, 255, 65],
    [410, 245, 55],
  ];
  return (
    <Svg width={LAYER_W} height={LAYER_H} viewBox={`0 0 ${LAYER_W} ${LAYER_H}`}>
      {trunks.map(([x, y, h], i) => (
        <G key={i}>
          <Path d={`M ${x},320 L ${x - 18},${y} L ${x + 18},${y} Z`} fill={c} />
          <Path d={`M ${x},${y + 10} L ${x - 26},${y - 20 + h} L ${x + 26},${y - 20 + h} Z`} fill={c} />
          <Path d={`M ${x},${y - 15} L ${x - 18},${y + h - 30} L ${x + 18},${y + h - 30} Z`} fill={c} />
        </G>
      ))}
    </Svg>
  );
}

export const AnimatedBackground = memo(function AnimatedBackground() {
  const driftAnim = useRef(new Animated.Value(0)).current;
  const fogAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: theme.animation.drift,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: theme.animation.drift,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const fog = Animated.loop(
      Animated.sequence([
        Animated.timing(fogAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fogAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    drift.start();
    fog.start();

    return () => {
      drift.stop();
      fog.stop();
    };
  }, [driftAnim, fogAnim]);

  const castleX = driftAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });
  const mountainX = driftAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] });
  const treeX = driftAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] });
  const fogOpacity = fogAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Layer 1: Sky gradient */}
      <LinearGradient
        colors={theme.gradients.skyLayer1 as unknown as [string, string, ...string[]]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Layer 2: Castle silhouette - slow drift */}
      <Animated.View
        style={[styles.svgLayer, { bottom: -20, transform: [{ translateX: castleX }] }]}
        renderToHardwareTextureAndroid
      >
        <CastleSilhouette />
      </Animated.View>

      {/* Layer 3: Mountain silhouette - medium drift */}
      <Animated.View
        style={[styles.svgLayer, { bottom: -10, transform: [{ translateX: mountainX }] }]}
        renderToHardwareTextureAndroid
      >
        <MountainSilhouette />
      </Animated.View>

      {/* Layer 4: Foreground trees - faster drift */}
      <Animated.View
        style={[styles.svgLayer, { bottom: 0, transform: [{ translateX: treeX }] }]}
        renderToHardwareTextureAndroid
      >
        <ForegroundTrees />
      </Animated.View>

      {/* Layer 5: Fog overlay */}
      <Animated.View style={[styles.fogLayer, { opacity: fogOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(80,40,200,0.0)", "rgba(80,40,200,0.1)", "rgba(80,40,200,0.0)"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Layer 6: Particles */}
      <ParticleEngine />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  svgLayer: {
    position: "absolute",
    left: -25,
    right: -25,
    alignItems: "center",
  },
  fogLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
