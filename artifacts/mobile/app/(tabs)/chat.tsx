import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatMessage";
import { ChamberHeader } from "@/components/chat/ChamberHeader";
import { RitualTimeline } from "@/components/chat/RitualTimeline";
import { ArcaneInputBar } from "@/components/chat/ArcaneInputBar";
import { SpellScrollSuggestion } from "@/components/chat/SpellScrollSuggestion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useChat } from "@/context/ChatContext";

const SUGGESTIONS = [
  "Dark fantasy RPG with procedural dungeons",
  "Cyberpunk action shooter with bullet time",
  "Cozy farming simulation with magic",
  "Horror survival with permadeath",
];

const TASK_STEPS = [
  { id: "analyze", label: "Analysing request",  done: true },
  { id: "world",   label: "Building world",      done: true },
  { id: "story",   label: "Creating story",      done: false },
  { id: "combat",  label: "Designing combat",    done: false },
  { id: "assets",  label: "Generating assets",   done: false },
  { id: "package", label: "Packaging project",   done: false },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const headerPaddingTop = Platform.OS === "web" ? 67 : insets.top + 12;
  const bottomInset = Platform.OS === "web" ? 84 : insets.bottom + 84;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    await sendMessage(text);
  };

  const handleSuggestion = (s: string) => setInput(s);

  return (
    <View style={s.root}>
      {/* Arcane observatory background */}
      <AnimatedBackground />

      {/* Dense content veil — keeps chat readable over the animated background */}
      <LinearGradient
        colors={["rgba(11,9,20,0.96)", "rgba(11,9,20,0.88)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Chamber header — avatar, status, actions */}
      <ChamberHeader
        paddingTop={headerPaddingTop}
        showTimeline={showTimeline}
        onToggleTimeline={() => setShowTimeline((v) => !v)}
        onClearChat={clearChat}
      />

      {/* Ritual progress timeline — smooth expand/collapse */}
      <RitualTimeline steps={TASK_STEPS} visible={showTimeline} />

      <KeyboardAvoidingView style={s.flex} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            messages.length === 1 ? (
              <SpellScrollSuggestion
                suggestions={SUGGESTIONS}
                onSelect={handleSuggestion}
              />
            ) : null
          }
        />

        {/* Arcane input bar */}
        <ArcaneInputBar
          input={input}
          onChangeText={setInput}
          onSend={handleSend}
          isTyping={isTyping}
          onSubmitEditing={handleSend}
          bottomPad={bottomInset}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0914",
  },
  flex: { flex: 1 },
  listContent: {
    paddingTop: 16,
    paddingBottom: 12,
  },
});
