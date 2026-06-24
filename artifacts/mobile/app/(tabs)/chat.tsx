import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
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

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList>(null);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    await sendMessage(text);
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }
      ]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.aiAvatarText}>AI</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Master Game Director</Text>
            <Text style={[styles.headerSub, { color: colors.success }]}>Online — ready to build</Text>
          </View>
        </View>
        <Pressable onPress={clearChat} style={styles.clearBtn}>
          <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            messages.length === 1 ? (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestTitle, { color: colors.mutedForeground }]}>Try asking...</Text>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => handleSuggestion(s)}
                    style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                    <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={[
          styles.inputBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }
        ]}>
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
                { backgroundColor: input.trim() && !isTyping ? colors.primary : colors.muted }
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: {
    padding: 8,
  },
  suggestionsWrap: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  suggestTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  inputBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
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
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
