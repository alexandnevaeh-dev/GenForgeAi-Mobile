import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatContextValue {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = "@genforge_chat";

const SYSTEM_PROMPT = `You are the Master Game Director for GenForgeAI — an AI that acts as an autonomous game development team. 

Your role:
- Understand the user's game vision through conversation
- Break their idea into concrete game systems (story, art, combat, levels, audio, etc.)
- Suggest genres, art styles, mechanics, and features
- Guide them toward creating their dream game
- Be encouraging, creative, and specific

When a user describes a game idea, respond with enthusiasm and specific details about:
- The core gameplay loop
- Art style recommendations  
- Story/world elements
- Technical approach
- What makes their game unique

Keep responses concise but inspiring. Use short paragraphs. Never use emojis.`;

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to GenForgeAI. I am your Master Game Director.\n\nDescribe the game you want to create — any genre, any idea. I will plan the entire project and coordinate our AI agents to build it for you.\n\nWhat game do you want to make?",
  timestamp: Date.now(),
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        if (saved.length > 0) setMessages(saved);
      }
    });
  }, []);

  const persist = useCallback((msgs: ChatMessage[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const streamingId =
        (Date.now() + 1).toString() + Math.random().toString(36).slice(2, 7);
      const streamingMsg: ChatMessage = {
        id: streamingId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      const withUser = (prev: ChatMessage[]) => {
        const next = [...prev, userMsg, streamingMsg];
        return next;
      };

      setMessages((prev) => withUser(prev));
      setIsTyping(true);

      try {
        const history = messages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY ?? ""}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              stream: true,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: text },
              ],
            }),
          }
        );

        if (!response.ok || !response.body) {
          throw new Error("API error");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));
          for (const line of lines) {
            const data = line.slice(5).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              accumulated += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingId
                    ? { ...m, content: accumulated }
                    : m
                )
              );
            } catch {
              // skip malformed chunks
            }
          }
        }

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: accumulated || "...", isStreaming: false }
              : m
          );
          persist(next);
          return next;
        });
      } catch {
        const fallback = simulateResponse(text);
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: fallback, isStreaming: false }
              : m
          );
          persist(next);
          return next;
        });
      } finally {
        setIsTyping(false);
      }
    },
    [messages, persist]
  );

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

function simulateResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("rpg") || lower.includes("fantasy")) {
    return "Excellent vision. I will design a role-playing game with deep character progression, branching storylines, and a world that reacts to your choices.\n\nCore systems I am planning:\n- Turn-based combat with elemental affinities\n- Procedural dungeon generation\n- Dynamic NPC dialogue trees\n- Crafting and enchantment economy\n\nReady to begin generation. Shall I proceed?";
  }
  if (lower.includes("platformer") || lower.includes("jump")) {
    return "A platformer — one of gaming's most expressive genres. I envision tight responsive controls with a distinctive movement mechanic that defines the experience.\n\nProposed design:\n- Momentum-based movement system\n- Grappling hook traversal\n- Pixel art with parallax depth layers\n- Procedurally themed worlds\n\nThis can be export-ready in under 10 minutes. Shall I start?";
  }
  if (lower.includes("horror") || lower.includes("scary")) {
    return "Horror is my specialty. I will craft an experience that builds dread through atmosphere, sound design, and unpredictable AI behavior.\n\nCore pillars:\n- Adaptive tension system that responds to player behavior\n- Dynamic lighting and shadow mechanics\n- Reactive audio environment\n- Permadeath with legacy progression\n\nReady to begin. Confirm and I will start all generation pipelines.";
  }
  return `Strong concept. Let me break this down into what our AI agents will build.\n\nBased on your description, I recommend:\n- Genre: Action-Adventure with roguelike elements\n- Art: Pixel art with dynamic lighting\n- Core loop: Explore, fight, upgrade, repeat\n- Hook: Your game's unique mechanic that no other game has\n\nOur agents can have a playable prototype ready in minutes. Want me to begin?`;
}
