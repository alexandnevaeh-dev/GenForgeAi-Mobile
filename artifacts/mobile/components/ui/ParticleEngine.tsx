import React, { useEffect, useRef, memo } from "react";
import { Animated, AppState, AppStateStatus, Dimensions, StyleSheet, View } from "react-native";

import { theme } from "@/constants/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const { count, types } = theme.particles;
const { particleMin, particleMax } = theme.animation;

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

function buildParticles(): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const typeConfig = types[i % types.length];
    const duration = particleMin + Math.random() * (particleMax - particleMin);
    return {
      id: i,
      left: Math.random() * SCREEN_W,
      top: SCREEN_H * 0.2 + Math.random() * SCREEN_H * 0.8,
      size: typeConfig.size + Math.random() * 1.5,
      color: typeConfig.color,
      duration,
      delay: Math.random() * particleMax,
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    };
  });
}

const PARTICLES = buildParticles();

function startParticle(p: Particle) {
  const travelDistance = p.top + 80;
  const loop = Animated.loop(
    Animated.parallel([
      Animated.timing(p.translateY, {
        toValue: -travelDistance,
        duration: p.duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(p.opacity, {
          toValue: 0.85,
          duration: p.duration * 0.18,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0.75,
          duration: p.duration * 0.64,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: p.duration * 0.18,
          useNativeDriver: true,
        }),
      ]),
    ])
  );
  loop.start();
  return loop;
}

export const ParticleEngine = memo(function ParticleEngine() {
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const appState = useRef(AppState.currentState);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function launchAll() {
      animationsRef.current = PARTICLES.map((p) => {
        p.translateY.setValue(0);
        p.opacity.setValue(0);
        const anim = startParticle(p);
        animationsRef.current.push(anim);
        return anim;
      });
    }

    function stopAll() {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
      animationsRef.current.forEach((a) => a.stop());
      animationsRef.current = [];
      PARTICLES.forEach((p) => {
        p.translateY.setValue(0);
        p.opacity.setValue(0);
      });
    }

    PARTICLES.forEach((p, i) => {
      const t = setTimeout(() => {
        const anim = startParticle(p);
        animationsRef.current[i] = anim;
      }, p.delay);
      timeouts.current.push(t);
    });

    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        stopAll();
      } else if (next === "active" && appState.current !== "active") {
        launchAll();
      }
      appState.current = next;
    });

    return () => {
      stopAll();
      sub.remove();
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [{ translateY: p.translateY }],
              shadowColor: p.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: p.size * 1.5,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
  },
});
