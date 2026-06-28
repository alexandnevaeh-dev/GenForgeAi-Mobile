import { useCallback, useRef } from "react";

export interface AmbientSoundConfig {
  source?: string | null;
  volume?: number;
  loop?: boolean;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface AmbientSoundControls {
  play: () => void;
  stop: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
}

/**
 * Ambient sound readiness hook.
 *
 * Prepares the interface for future ambient audio without auto-playing anything.
 * Wire in expo-av (or expo-audio) in the play/stop/pause bodies when audio assets
 * are available. All methods are no-ops until then.
 *
 * Usage:
 *   const forge = useAmbientSound({ source: null, volume: 0.4, loop: true });
 *   // Later: forge.play() to start ambient forge sounds.
 */
export function useAmbientSound(config?: AmbientSoundConfig): AmbientSoundControls {
  const playing = useRef(false);
  const volume = useRef(config?.volume ?? 0.5);

  const play = useCallback(() => {
    if (playing.current) return;
    playing.current = true;
    // TODO: load config.source via expo-av Sound.createAsync() and play with fade-in
  }, []);

  const stop = useCallback(() => {
    if (!playing.current) return;
    playing.current = false;
    // TODO: fade out then Sound.unloadAsync()
  }, []);

  const pause = useCallback(() => {
    playing.current = false;
    // TODO: Sound.pauseAsync()
  }, []);

  const setVolume = useCallback((v: number) => {
    volume.current = Math.max(0, Math.min(1, v));
    // TODO: Sound.setVolumeAsync(volume.current)
  }, []);

  return { play, stop, pause, setVolume, isPlaying: playing.current };
}
