import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type FeedTab = "feed" | "showcase" | "challenges" | "tutorials";

const TABS: { label: string; value: FeedTab; icon: string }[] = [
  { label: "Feed", value: "feed", icon: "rss" },
  { label: "Showcase", value: "showcase", icon: "award" },
  { label: "Challenges", value: "challenges", icon: "flag" },
  { label: "Tutorials", value: "tutorials", icon: "book-open" },
];

interface Post {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  content: string;
  image?: boolean;
  likes: number;
  comments: number;
  type: "prompt" | "project" | "tip" | "achievement";
}

const POSTS: Post[] = [
  {
    id: "1", author: "Alex Chen", handle: "@alexc_dev", avatar: "A", time: "2m ago",
    content: "Just generated a 40-level roguelike dungeon crawler in 8 minutes using GenForgeAI. The World Architect agent is insane — procedural generation + hand-crafted feel. Sharing my prompt below.",
    type: "prompt", likes: 234, comments: 47,
  },
  {
    id: "2", author: "Maya Torres", handle: "@maya_games", avatar: "M", time: "15m ago",
    content: "Pro tip: Start with the story prompt, then let the AI infer the mechanics. I got a fully balanced combat system just from describing the lore. Game Director is incredibly smart.",
    type: "tip", likes: 891, comments: 123,
  },
  {
    id: "3", author: "Dev Studio", handle: "@devstudio_hq", avatar: "D", time: "1h ago",
    content: "Our team of 3 shipped a complete horror survival game in 2 days using GenForgeAI. Boss Designer + Horror template + custom sound pack = fire. Check the showcase page.",
    type: "achievement", likes: 1203, comments: 89,
  },
  {
    id: "4", author: "Sam Rivera", handle: "@sambuilds", avatar: "S", time: "3h ago",
    content: "Weekly challenge: Build a game where the protagonist is a chef in a haunted kitchen. Best prompt wins 500 AI Credits. Submit by Friday.",
    type: "achievement", likes: 445, comments: 211,
  },
  {
    id: "5", author: "AI Insights", handle: "@genforge_tips", avatar: "G", time: "5h ago",
    content: "New prompt engineering guide is live. Learn how to get the most out of the Story Architect and Character Designer agents. Link in bio.",
    type: "tip", likes: 672, comments: 34,
  },
];

const SHOWCASE_PROJECTS = [
  { id: "1", title: "Void Descent", genre: "Horror", author: "@darkpixel", plays: "12.4K", rating: 4.9 },
  { id: "2", title: "Crystal Kingdom", genre: "RPG", author: "@crystaldev", plays: "8.7K", rating: 4.8 },
  { id: "3", title: "Mech Wars", genre: "Strategy", author: "@mechmaster", plays: "6.2K", rating: 4.7 },
  { id: "4", title: "Pixel Farm Life", genre: "Simulation", author: "@cozydev", plays: "21.1K", rating: 5.0 },
];

const CHALLENGES = [
  { id: "1", title: "Horror in 2 Prompts", prize: "1,000 Credits", ends: "3 days", entries: 234, difficulty: "Medium" },
  { id: "2", title: "No Combat Allowed", prize: "500 Credits", ends: "5 days", entries: 89, difficulty: "Hard" },
  { id: "3", title: "Cozy Game Jam", prize: "2,000 Credits", ends: "1 week", entries: 412, difficulty: "Easy" },
];

const TYPE_COLOR: Record<Post["type"], string> = {
  prompt: "#2B7FFF",
  project: "#7B2FFF",
  tip: "#22C55E",
  achievement: "#F97316",
};

const TYPE_LABEL: Record<Post["type"], string> = {
  prompt: "Prompt Share",
  project: "Project",
  tip: "Pro Tip",
  achievement: "Achievement",
};

function PostCard({ post }: { post: Post }) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{post.avatar}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.author}</Text>
          <Text style={[styles.postHandle, { color: colors.mutedForeground }]}>{post.handle} · {post.time}</Text>
        </View>
        <View style={[styles.typeChip, { backgroundColor: TYPE_COLOR[post.type] + "22" }]}>
          <Text style={[styles.typeText, { color: TYPE_COLOR[post.type] }]}>{TYPE_LABEL[post.type]}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>
      <View style={styles.postFooter}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLiked((v) => !v);
          }}
          style={styles.postAction}
        >
          <Feather name="heart" size={15} color={liked ? "#EF4444" : colors.mutedForeground} />
          <Text style={[styles.postActionText, { color: liked ? "#EF4444" : colors.mutedForeground }]}>
            {post.likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable style={styles.postAction}>
          <Feather name="message-circle" size={15} color={colors.mutedForeground} />
          <Text style={[styles.postActionText, { color: colors.mutedForeground }]}>{post.comments}</Text>
        </Pressable>
        <Pressable style={styles.postAction}>
          <Feather name="share-2" size={15} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={styles.postAction}>
          <Feather name="bookmark" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FeedTab>("feed");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <Pressable>
          <Feather name="edit-2" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={[styles.tab, activeTab === tab.value && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Feather name={tab.icon as any} size={13} color={activeTab === tab.value ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.value ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
        {activeTab === "feed" && (
          <View style={styles.feedContent}>
            {/* Live badge */}
            <View style={[styles.liveBanner, { backgroundColor: colors.success + "22", borderColor: colors.success }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>
                2,341 developers active right now
              </Text>
            </View>
            {POSTS.map((post) => <PostCard key={post.id} post={post} />)}
          </View>
        )}

        {activeTab === "showcase" && (
          <View style={styles.feedContent}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TOP GAMES THIS WEEK</Text>
            {SHOWCASE_PROJECTS.map((proj, i) => (
              <View key={proj.id} style={[styles.showcaseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.showcaseRank, { color: colors.primary }]}>#{i + 1}</Text>
                <View style={[styles.showcaseIcon, { backgroundColor: colors.muted }]}>
                  <Feather name="layers" size={18} color={colors.primary} />
                </View>
                <View style={styles.showcaseInfo}>
                  <Text style={[styles.showcaseTitle, { color: colors.foreground }]}>{proj.title}</Text>
                  <Text style={[styles.showcaseMeta, { color: colors.mutedForeground }]}>
                    {proj.genre} · {proj.author} · {proj.plays} plays
                  </Text>
                </View>
                <View style={styles.showcaseRating}>
                  <Feather name="star" size={12} color="#F97316" />
                  <Text style={[styles.ratingVal, { color: colors.foreground }]}>{proj.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "challenges" && (
          <View style={styles.feedContent}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE CHALLENGES</Text>
            {CHALLENGES.map((ch) => (
              <View key={ch.id} style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.challengeHeader}>
                  <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{ch.title}</Text>
                  <View style={[styles.diffChip, {
                    backgroundColor: ch.difficulty === "Easy" ? colors.success + "22" :
                      ch.difficulty === "Medium" ? colors.warning + "22" : colors.destructive + "22"
                  }]}>
                    <Text style={[styles.diffText, {
                      color: ch.difficulty === "Easy" ? colors.success :
                        ch.difficulty === "Medium" ? colors.warning : colors.destructive
                    }]}>{ch.difficulty}</Text>
                  </View>
                </View>
                <View style={styles.challengeMeta}>
                  <View style={styles.challengeMetaItem}>
                    <Feather name="award" size={13} color={colors.accent} />
                    <Text style={[styles.challengeMetaText, { color: colors.foreground }]}>{ch.prize}</Text>
                  </View>
                  <View style={styles.challengeMetaItem}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.challengeMetaText, { color: colors.mutedForeground }]}>Ends in {ch.ends}</Text>
                  </View>
                  <View style={styles.challengeMetaItem}>
                    <Feather name="users" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.challengeMetaText, { color: colors.mutedForeground }]}>{ch.entries} entries</Text>
                  </View>
                </View>
                <Pressable style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.joinBtnText}>Join Challenge</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {activeTab === "tutorials" && (
          <View style={styles.feedContent}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LEARN GENFORGEAI</Text>
            {[
              { title: "Getting Started: Your First Game in 5 Minutes", duration: "5 min", level: "Beginner" },
              { title: "Mastering the Master Game Director", duration: "12 min", level: "Intermediate" },
              { title: "Advanced Prompt Engineering for AI Agents", duration: "18 min", level: "Advanced" },
              { title: "Exporting to Godot: Complete Guide", duration: "25 min", level: "Intermediate" },
              { title: "Building Multiplayer Games with GenForgeAI", duration: "30 min", level: "Advanced" },
            ].map((tut, i) => (
              <Pressable key={i} style={[styles.tutRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tutIcon, { backgroundColor: colors.muted }]}>
                  <Feather name="play-circle" size={22} color={colors.primary} />
                </View>
                <View style={styles.tutInfo}>
                  <Text style={[styles.tutTitle, { color: colors.foreground }]}>{tut.title}</Text>
                  <Text style={[styles.tutMeta, { color: colors.mutedForeground }]}>{tut.duration} · {tut.level}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  feedContent: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  postHandle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  typeChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  postFooter: { flexDirection: "row", gap: 16, alignItems: "center" },
  postAction: { flexDirection: "row", alignItems: "center", gap: 5 },
  postActionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  showcaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  showcaseRank: { fontSize: 16, fontFamily: "Inter_700Bold", width: 28 },
  showcaseIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  showcaseInfo: { flex: 1 },
  showcaseTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  showcaseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  showcaseRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  challengeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  challengeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  challengeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  diffChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  challengeMeta: { flexDirection: "row", gap: 14 },
  challengeMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  challengeMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  joinBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  joinBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  tutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tutIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tutInfo: { flex: 1 },
  tutTitle: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 19 },
  tutMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
