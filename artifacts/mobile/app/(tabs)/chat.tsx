import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatMessage";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

const SUGGESTIONS = [
  "Dark fantasy RPG with procedural dungeons",
  "Cyberpunk action shooter with bullet time",
  "Cozy farming simulation with magic",
  "Horror survival with permadeath",
];

const TASK_STEPS = [
  { id: "analyze", label: "Analyzing request", done: true },
  { id: "world", label: "Building world", done: true },
  { id: "story", label: "Creating story", done: false },
  { id: "combat", label: "Designing combat", done: false },
  { id: "assets", label: "Generating assets", done: false },
  { id: "package", label: "Packaging project", done: false },
];

function TaskTimeline() {
  const colors = useColors();
  const activeIdx = TASK_STEPS.findIndex((s) => !s.done);
  return (
    <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.timelineTitle, { color: colors.mutedForeground }]}>AI TASK PROGRESS</Text>
      {TASK_STEPS.map((step, i) => (
        <View key={step.id} style={styles.timelineRow}>
          <View style={[
            styles.timelineDot,
            {
              backgroundColor: step.done ? colors.success : i === activeIdx ? colors.primary : colors.border,
            },
          ]} />
          {i < TASK_STEPS.length - 1 && (
            <View style={[styles.timelineLine, { backgroundColor: step.done ? colors.success + "44" : colors.border }]} />
          )}
          <Text style={[
            styles.timelineLabel,
            {
              color: step.done ? colors.foreground : i === activeIdx ? colors.primary : colors.mutedForeground,
              fontFamily: i === activeIdx ? "Inter_600SemiBold" : "Inter_400Regular",
            },
          ]}>
            {step.done ? "✓ " : ""}{step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const flatRef = useRef<FlatList>(null);

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Studio</Text>
            <Text style={[styles.headerSub, { color: colors.success }]}>Master Game Director · Online</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTimeline((v) => !v)}
            style={[styles.headerBtn, { backgroundColor: showTimeline ? colors.primary + "22" : colors.muted }]}
          >
            <Feather name="activity" size={16} color={showTimeline ? colors.primary : colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={clearChat} style={[styles.headerBtn, { backgroundColor: colors.muted }]}>
            <Feather name="refresh-ccw" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Task Timeline (collapsible) */}
      {showTimeline && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <TaskTimeline />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            messages.length === 1 ? (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestTitle, { color: colors.mutedForeground }]}>
                  Start with a prompt...
                </Text>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => handleSuggestion(s)}
                    style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Feather name="zap" size={13} color={colors.primary} />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                    <Feather name="arrow-up-right" size={13} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={[
          styles.inputBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 8,
          },
        ]}>
          {/* Voice + attach row */}
          <View style={styles.inputToolbar}>
            <Pressable style={[styles.toolBtn, { backgroundColor: colors.muted }]}>
              <Feather name="mic" size={16} color={colors.mutedForeground} />
            </Pressable>
            <Pressable style={[styles.toolBtn, { backgroundColor: colors.muted }]}>
              <Feather name="paperclip" size={16} color={colors.mutedForeground} />
            </Pressable>
            <Pressable style={[styles.toolBtn, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={[styles.agentCount, { color: colors.mutedForeground }]}>
              23 agents ready
            </Text>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Describe your game..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !isTyping ? colors.primary : colors.muted },
              ]}
            >
              <Feather name={isTyping ? "loader" : "send"} size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeline: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  timelineTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, position: "relative" },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3, flexShrink: 0 },
  timelineLine: {
    position: "absolute",
    left: 4.5,
    top: 13,
    width: 1,
    height: 18,
  },
  timelineLabel: { fontSize: 13, flex: 1 },
  suggestionsWrap: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  suggestTitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  inputToolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  toolBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  agentCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
