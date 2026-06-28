import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type FeedTab = "feed" | "showcase" | "challenges" | "tutorials";

const TABS: { label: string; value: FeedTab; icon: string }[] = [
  { label: "Feed",       value: "feed",       icon: "rss" },
  { label: "Showcase",   value: "showcase",   icon: "award" },
  { label: "Challenges", value: "challenges", icon: "flag" },
  { label: "Tutorials",  value: "tutorials",  icon: "book-open" },
];

interface Post {
  id: string;
  authorId: string;
  content: string;
  type: "prompt" | "project" | "tip" | "achievement";
  projectId?: string | null;
  likes: number;
  comments: number;
  createdAt: string;
  displayName: string;
  username: string;
  avatar?: string | null;
}

const SHOWCASE_PROJECTS = [
  { id: "1", title: "Void Descent",     genre: "Horror",     author: "@darkpixel",   plays: "12.4K", rating: 4.9 },
  { id: "2", title: "Crystal Kingdom",  genre: "RPG",        author: "@crystaldev",  plays: "8.7K",  rating: 4.8 },
  { id: "3", title: "Mech Wars",        genre: "Strategy",   author: "@mechmaster",  plays: "6.2K",  rating: 4.7 },
  { id: "4", title: "Pixel Farm Life",  genre: "Simulation", author: "@cozydev",     plays: "21.1K", rating: 5.0 },
];

const CHALLENGES = [
  { id: "1", title: "Horror in 2 Prompts", prize: "1,000 Credits", ends: "3 days",  entries: 234, difficulty: "Medium" },
  { id: "2", title: "No Combat Allowed",   prize: "500 Credits",   ends: "5 days",  entries: 89,  difficulty: "Hard" },
  { id: "3", title: "Cozy Game Jam",       prize: "2,000 Credits", ends: "1 week",  entries: 412, difficulty: "Easy" },
];

const TYPE_COLOR: Record<string, string> = {
  prompt:      "#2B7FFF",
  project:     "#7B2FFF",
  tip:         "#22C55E",
  achievement: "#F97316",
};

const TYPE_LABEL: Record<string, string> = {
  prompt:      "Prompt Share",
  project:     "Project",
  tip:         "Pro Tip",
  achievement: "Achievement",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PostCard({
  post,
  onLike,
  likedIds,
  ownerId,
  onDelete,
}: {
  post: Post;
  onLike: (id: string) => void;
  likedIds: Set<string>;
  ownerId?: string;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const liked = likedIds.has(post.id);
  const isOwn = ownerId === post.authorId;
  const initials = (post.displayName || post.username || "?").slice(0, 2).toUpperCase();

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: TYPE_COLOR[post.type] + "30" }]}>
          <Text style={[styles.avatarText, { color: TYPE_COLOR[post.type] }]}>{initials}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.displayName}</Text>
          <Text style={[styles.postHandle, { color: colors.mutedForeground }]}>
            @{post.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLOR[post.type] + "20" }]}>
          <Text style={[styles.typeBadgeText, { color: TYPE_COLOR[post.type] }]}>
            {TYPE_LABEL[post.type] ?? post.type}
          </Text>
        </View>
        {isOwn && (
          <Pressable onPress={() => onDelete(post.id)} style={styles.deleteBtn}>
            <Feather name="trash-2" size={13} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>
      <View style={styles.postActions}>
        <Pressable
          onPress={() => onLike(post.id)}
          style={styles.actionBtn}
        >
          <Feather
            name="heart"
            size={15}
            color={liked ? "#EF4444" : colors.mutedForeground}
            fill={liked ? "#EF4444" : "none"}
          />
          <Text style={[styles.actionCount, { color: liked ? "#EF4444" : colors.mutedForeground }]}>
            {post.likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        <View style={styles.actionBtn}>
          <Feather name="message-circle" size={15} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.comments}</Text>
        </View>
        <View style={styles.actionBtn}>
          <Feather name="share-2" size={15} color={colors.mutedForeground} />
        </View>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const [activeTab, setActiveTab] = useState<FeedTab>("feed");
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [draft, setDraft]         = useState("");
  const [draftType, setDraftType] = useState<Post["type"]>("tip");
  const [posting, setPosting]     = useState(false);

  const topPad    = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 60 : insets.bottom + 32;

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community/posts?limit=30");
      if (res.ok) {
        const data = (await res.json()) as { posts: Post[] };
        setPosts(data.posts);
      }
    } catch { /* silently ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchPosts();
  }, [fetchPosts]);

  async function handleLike(postId: string) {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to like posts.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Optimistic toggle
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Refresh counts
      void fetchPosts();
    } catch { /* ignore */ }
  }

  async function handleDelete(postId: string) {
    Alert.alert("Delete post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await fetch(`/api/community/posts/${postId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            setPosts((p) => p.filter((x) => x.id !== postId));
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  async function handlePost() {
    if (!draft.trim()) return;
    if (!accessToken) { Alert.alert("Sign in required"); return; }
    setPosting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: draft.trim(), type: draftType }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { post: Post };
      setPosts((p) => [data.post, ...p]);
      setDraft("");
      setComposing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Compose modal */}
      <Modal visible={composing} animationType="slide" transparent onRequestClose={() => setComposing(false)}>
        <View style={styles.composeOverlay}>
          <Pressable style={styles.composeBackdrop} onPress={() => setComposing(false)} />
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.composeHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.composeTitle, { color: colors.foreground }]}>Share with the community</Text>
            {/* Type selector */}
            <View style={styles.typeRow}>
              {(["tip", "prompt", "achievement", "project"] as Post["type"][]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setDraftType(t)}
                  style={[styles.typeBtn, {
                    backgroundColor: draftType === t ? TYPE_COLOR[t] + "20" : colors.muted,
                    borderColor: draftType === t ? TYPE_COLOR[t] : "transparent",
                    borderWidth: 1,
                  }]}
                >
                  <Text style={[styles.typeBtnText, { color: draftType === t ? TYPE_COLOR[t] : colors.mutedForeground }]}>
                    {TYPE_LABEL[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.composeInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Share a tip, prompt, or project update…"
              placeholderTextColor={colors.mutedForeground}
              value={draft}
              onChangeText={setDraft}
              multiline
              numberOfLines={5}
              autoFocus
            />
            <View style={styles.composeActions}>
              <Pressable onPress={() => setComposing(false)} style={[styles.composeCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handlePost}
                disabled={posting || !draft.trim()}
                style={[styles.composePostBtn, { backgroundColor: draft.trim() ? colors.primary : colors.border }]}
              >
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="send" size={14} color="#fff" />}
                <Text style={styles.composePostText}>Post</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <Pressable onPress={() => { if (!accessToken) { Alert.alert("Sign in required"); return; } setComposing(true); }}>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === "feed" && (
          <View style={styles.feedContent}>
            <View style={[styles.liveBanner, { backgroundColor: colors.success + "22", borderColor: colors.success }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>
                {posts.length} posts · Tap ✏ to share
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading feed…</Text>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="message-circle" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Be the first to post</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Share your prompts, tips, or projects with the community.
                </Text>
                <Pressable
                  onPress={() => { if (accessToken) setComposing(true); }}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="edit-2" size={14} color="#fff" />
                  <Text style={styles.emptyBtnText}>Write a post</Text>
                </Pressable>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  likedIds={likedIds}
                  ownerId={user?.id}
                  onDelete={handleDelete}
                />
              ))
            )}
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
                  <View style={[styles.challengeIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="flag" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{ch.title}</Text>
                    <Text style={[styles.challengeMeta, { color: colors.mutedForeground }]}>
                      Ends in {ch.ends} · {ch.entries} entries
                    </Text>
                  </View>
                  <View style={[styles.difficultyChip, {
                    backgroundColor: ch.difficulty === "Easy" ? "#22C55E20" : ch.difficulty === "Hard" ? "#EF444420" : "#FBBF2420",
                  }]}>
                    <Text style={[styles.difficultyText, {
                      color: ch.difficulty === "Easy" ? "#22C55E" : ch.difficulty === "Hard" ? "#EF4444" : "#FBBF24",
                    }]}>{ch.difficulty}</Text>
                  </View>
                </View>
                <View style={[styles.prizeRow, { backgroundColor: "#FBBF2412", borderColor: "#FBBF2440" }]}>
                  <Feather name="award" size={13} color="#FBBF24" />
                  <Text style={[styles.prizeText, { color: "#FBBF24" }]}>Prize: {ch.prize}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "tutorials" && (
          <View style={styles.feedContent}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GETTING STARTED</Text>
            {[
              { title: "Prompt Engineering 101",    time: "8 min", level: "Beginner",     icon: "book" },
              { title: "Mastering Story Architect",  time: "12 min", level: "Intermediate", icon: "book-open" },
              { title: "Combat System Deep Dive",    time: "15 min", level: "Advanced",     icon: "shield" },
              { title: "Asset Pipeline Walkthrough", time: "10 min", level: "Beginner",     icon: "image" },
              { title: "Publishing Your First Game", time: "20 min", level: "Intermediate", icon: "send" },
            ].map((tut) => (
              <View key={tut.title} style={[styles.tutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tutIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name={tut.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.tutInfo}>
                  <Text style={[styles.tutTitle, { color: colors.foreground }]}>{tut.title}</Text>
                  <Text style={[styles.tutMeta, { color: colors.mutedForeground }]}>{tut.time} read · {tut.level}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1 },
  header:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title:             { fontSize: 20, fontFamily: "Inter_700Bold" },
  tabBar:            { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab:               { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:         {},
  tabLabel:          { fontSize: 12, fontFamily: "Inter_500Medium" },
  feedContent:       { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 12 },
  liveBanner:        { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  liveDot:           { width: 8, height: 8, borderRadius: 4 },
  liveText:          { fontSize: 13, fontFamily: "Inter_500Medium" },
  loadingWrap:       { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText:       { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyWrap:         { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle:        { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText:         { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn:          { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText:      { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  postCard:          { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  postHeader:        { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:            { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText:        { fontSize: 14, fontFamily: "Inter_700Bold" },
  postMeta:          { flex: 1 },
  postAuthor:        { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  postHandle:        { fontSize: 11, fontFamily: "Inter_400Regular" },
  typeBadge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText:     { fontSize: 10, fontFamily: "Inter_700Bold" },
  deleteBtn:         { padding: 4 },
  postContent:       { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  postActions:       { flexDirection: "row", gap: 16 },
  actionBtn:         { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount:       { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionLabel:      { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  showcaseRow:       { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  showcaseRank:      { fontSize: 16, fontFamily: "Inter_700Bold", width: 28, textAlign: "center" },
  showcaseIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  showcaseInfo:      { flex: 1 },
  showcaseTitle:     { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  showcaseMeta:      { fontSize: 12, fontFamily: "Inter_400Regular" },
  showcaseRating:    { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingVal:         { fontSize: 13, fontFamily: "Inter_700Bold" },
  challengeCard:     { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  challengeHeader:   { flexDirection: "row", alignItems: "center", gap: 10 },
  challengeIcon:     { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  challengeInfo:     { flex: 1 },
  challengeTitle:    { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  challengeMeta:     { fontSize: 12, fontFamily: "Inter_400Regular" },
  difficultyChip:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  difficultyText:    { fontSize: 10, fontFamily: "Inter_700Bold" },
  prizeRow:          { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  prizeText:         { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tutCard:           { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  tutIcon:           { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tutInfo:           { flex: 1 },
  tutTitle:          { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tutMeta:           { fontSize: 12, fontFamily: "Inter_400Regular" },
  // Compose modal
  composeOverlay:    { flex: 1, justifyContent: "flex-end" },
  composeBackdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "#000000BB" },
  composeSheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  composeHandle:     { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  composeTitle:      { fontSize: 17, fontFamily: "Inter_700Bold" },
  typeRow:           { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  typeBtnText:       { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  composeInput:      { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top" },
  composeActions:    { flexDirection: "row", gap: 12 },
  composeCancelBtn:  { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  composeCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  composePostBtn:    { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  composePostText:   { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
