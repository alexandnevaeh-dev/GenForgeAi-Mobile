/**
 * ProjectChatPanel — project-aware streaming chat.
 *
 * Talks to POST /api/projects/:id/chat which injects the project's blueprint,
 * agent memories, and asset data into the system prompt before streaming.
 */

import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

function getSuggestions(genre: string, title: string): string[] {
  return [
    `What makes ${title} unique compared to other ${genre} games?`,
    "How should I expand the combat system?",
    "Suggest a new area or level for the game",
    "What NPCs would enrich the world?",
    "How can I improve the difficulty balance?",
    "What's the strongest narrative hook in this game?",
  ];
}

function ChatBubble({ message }: { message: Message }) {
  const colors = useColors();
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="cpu" size={13} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, alignSelf: "flex-end" }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignSelf: "flex-start" },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? "#fff" : colors.foreground },
          ]}
        >
          {message.content}
          {message.streaming && (
            <Text style={{ color: isUser ? "#fff" : colors.primary }}> ▍</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

interface Props {
  projectId: string;
  projectTitle: string;
  projectGenre: string;
  hasGeneratedData: boolean;
}

export function ProjectChatPanel({
  projectId,
  projectTitle,
  projectGenre,
  hasGeneratedData,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = getSuggestions(projectGenre, projectTitle);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming || !accessToken) return;

      setInput("");

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
      };

      const history = [...messages, userMsg];
      setMessages(history);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);

      // Placeholder for streaming assistant response
      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };
      setMessages([...history, assistantMsg]);
      setIsStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6)) as {
                delta?: string;
                done?: boolean;
                error?: string;
              };
              if (payload.error) throw new Error(payload.error);
              if (payload.done) break;
              if (payload.delta) {
                accumulated += payload.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated, streaming: true }
                      : m
                  )
                );
                flatRef.current?.scrollToEnd({ animated: false });
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, accessToken, projectId]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={insets.bottom + 120}
    >
      {/* Header strip */}
      <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.aiDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.chatHeaderText, { color: colors.mutedForeground }]}>
          Game Director AI · knows your project
        </Text>
        {messages.length > 0 && (
          <Pressable onPress={clearChat} hitSlop={8}>
            <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Messages / empty state */}
      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="message-circle" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Chat about {projectTitle}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {hasGeneratedData
              ? "The AI knows your game's blueprint, world, characters, and balance. Ask anything."
              : "Generate your game first to unlock full context. You can still ask general questions now."}
          </Text>

          {/* Suggested prompts */}
          <View style={styles.suggestionsWrap}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                onPress={() => void sendMessage(s)}
                style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={2}>
                  {s}
                </Text>
                <Feather name="arrow-up-right" size={12} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your game…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={1000}
          onSubmitEditing={() => void sendMessage(input)}
          returnKeyType="send"
          editable={!isStreaming}
        />
        <Pressable
          onPress={() => void sendMessage(input)}
          disabled={!input.trim() || isStreaming}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                !input.trim() || isStreaming ? colors.border : colors.primary,
            },
          ]}
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={16} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiDot: { width: 7, height: 7, borderRadius: 4 },
  chatHeaderText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyWrap: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
    marginBottom: 8,
  },
  suggestionsWrap: { width: "100%", gap: 8 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
