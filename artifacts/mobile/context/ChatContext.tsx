import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

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

const STORAGE_KEY = "@genforge_chat_v2";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to GenForgeAI. I am your Master Game Director.\n\nDescribe the game you want to create — any genre, any idea. I will plan the entire project and coordinate our AI agents to build it for you.\n\nWhat game do you want to make?",
  timestamp: Date.now(),
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as ChatMessage[];
          if (saved.length > 0) setMessages(saved);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const persist = useCallback((msgs: ChatMessage[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const streamingId = `${Date.now() + 1}-${Math.random().toString(36).slice(2, 7)}`;
      const streamingMsg: ChatMessage = {
        id: streamingId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, streamingMsg]);
      setIsTyping(true);

      // Build history for context (exclude the streaming placeholder)
      const history = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenRef.current
              ? { Authorization: `Bearer ${tokenRef.current}` }
              : {}),
          },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: text }],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Chat API error");
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
            try {
              const data = JSON.parse(line.slice(5).trim()) as {
                content?: string;
                done?: boolean;
                error?: string;
              };
              if (data.content) {
                accumulated += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId
                      ? { ...m, content: accumulated }
                      : m
                  )
                );
              }
              if (data.done || data.error) break;
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
        // Fallback: helpful error message without fake response
        const errMsg =
          "I'm having trouble connecting right now. Please try again in a moment.";
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: errMsg, isStreaming: false }
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
