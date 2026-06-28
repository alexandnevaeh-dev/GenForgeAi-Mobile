import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const STARS = [
  { x: "5%",  y: "7%",  s: 1.5, d: 0    },
  { x: "18%", y: "3%",  s: 2,   d: 300  },
  { x: "32%", y: "11%", s: 1,   d: 600  },
  { x: "45%", y: "5%",  s: 1.8, d: 900  },
  { x: "62%", y: "2%",  s: 1.2, d: 200  },
  { x: "76%", y: "9%",  s: 2,   d: 700  },
  { x: "88%", y: "4%",  s: 1.5, d: 400  },
  { x: "94%", y: "13%", s: 1,   d: 100  },
  { x: "12%", y: "18%", s: 1,   d: 1100 },
  { x: "28%", y: "22%", s: 1.5, d: 800  },
  { x: "55%", y: "16%", s: 1.2, d: 500  },
  { x: "70%", y: "20%", s: 1,   d: 1400 },
  { x: "82%", y: "25%", s: 1.8, d: 1000 },
  { x: "8%",  y: "30%", s: 1.2, d: 250  },
  { x: "40%", y: "28%", s: 1,   d: 1200 },
  { x: "90%", y: "32%", s: 1.5, d: 650  },
  { x: "22%", y: "35%", s: 1,   d: 350  },
  { x: "60%", y: "38%", s: 1.2, d: 900  },
  { x: "75%", y: "42%", s: 1,   d: 1300 },
  { x: "48%", y: "44%", s: 1.5, d: 450  },
];

const PARTICLES = [
  { left: "12%", delay: 0,    dur: 7000, size: 3, opacity: 0.4 },
  { left: "28%", delay: 1200, dur: 9000, size: 2, opacity: 0.3 },
  { left: "55%", delay: 2400, dur: 6500, size: 4, opacity: 0.5 },
  { left: "72%", delay: 600,  dur: 8000, size: 2, opacity: 0.35 },
  { left: "85%", delay: 3000, dur: 7500, size: 3, opacity: 0.4 },
  { left: "42%", delay: 1800, dur: 10000, size: 2, opacity: 0.25 },
];

function StarDot({ x, y, s, d }: { x: string; y: string; s: number; d: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const delay = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }, d);
    return () => clearTimeout(delay);
  }, [opacity, d]);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x, top: y,
        width: s * 2, height: s * 2,
        borderRadius: s,
        backgroundColor: "#FFFFFF",
        opacity,
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: s * 2,
        elevation: 2,
      }}
    />
  );
}

function FloatingParticle({ left, delay, dur, size, opacity: maxOpacity }: typeof PARTICLES[0]) {
  const translateY = useRef(new Animated.Value(320)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: maxOpacity, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: maxOpacity, duration: dur - 1600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, { toValue: -120, duration: dur, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 320, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [translateY, opacity, dur, delay, maxOpacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#3B8FFF",
        opacity,
        shadowColor: "#3B8FFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: size * 2,
        elevation: 3,
        transform: [{ translateY }],
      }}
    />
  );
}

export const AuthBackground = memo(function AuthBackground() {
  const fogAnim = useRef(new Animated.Value(0)).current;
  const circleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fogAnim, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(fogAnim, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(circleRotate, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [fogAnim, circleRotate]);

  const fogOpacity = fogAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const spin = circleRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={s.root} pointerEvents="none">
      {/* Sky gradient */}
      <LinearGradient
        colors={["#06040F", "#0A0820", "#0D0B22", "#0B0914"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {STARS.map((star, i) => <StarDot key={i} {...star} />)}

      {/* Rotating magic circle (bottom-center) */}
      <Animated.View style={[s.magicCircle, { transform: [{ rotate: spin }] }]} />
      <Animated.View style={[s.magicCircleInner, { transform: [{ rotate: spin }] }]} />

      {/* Fog overlay */}
      <Animated.View style={[s.fog, { opacity: fogOpacity }]}>
        <LinearGradient
          colors={["rgba(30,15,80,0)", "rgba(20,10,60,0.4)", "rgba(30,15,80,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bottom fog */}
      <LinearGradient
        colors={["rgba(11,9,20,0)", "rgba(11,9,20,0.6)"]}
        style={s.bottomFog}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}
    </View>
  );
});

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  magicCircle: {
    position: "absolute",
    bottom: -180,
    alignSelf: "center",
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.08)",
    borderStyle: "dashed" as any,
  },
  magicCircleInner: {
    position: "absolute",
    bottom: -140,
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(123,47,255,0.06)",
  },
  fog: { ...StyleSheet.absoluteFillObject },
  bottomFog: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
});
