import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface LiveEvent {
  name: string;
  type: "seasonal" | "daily" | "weekly" | "limited";
  description: string;
  duration: string;
  rewards: string[];
  startDate: string;
}

interface DailyReward {
  day: number;
  reward: string;
  icon: string;
}

interface Announcement {
  title: string;
  body: string;
  cta: string;
}

interface PushNotification {
  title: string;
  body: string;
  trigger: string;
}

interface LiveOpsData {
  events: LiveEvent[];
  dailyRewards: DailyReward[];
  announcement: Announcement;
  pushNotifications: PushNotification[];
  seasonalCalendar: string;
}

interface Props {
  projectId: string;
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  seasonal: "#7B2FFF",
  daily:    "#22C55E",
  weekly:   "#2B7FFF",
  limited:  "#F97316",
};

const EVENT_TYPE_ICON: Record<string, string> = {
  seasonal: "star",
  daily:    "sun",
  weekly:   "calendar",
  limited:  "zap",
};

export function LiveOpsPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [data, setData] = useState<LiveOpsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/liveops`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "LiveOps generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="radio" size={20} color="#F97316" />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>LiveOps Tools</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Events · Daily rewards · Push notifications · Announcements
          </Text>
        </View>
      </View>

      {!data && !loading && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={32} color="#F97316" />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Generate LiveOps Plan</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            AI creates a 3-month event calendar, daily reward streak, launch announcement, and smart push notifications tailored to your game.
          </Text>
          <Pressable onPress={generate} style={styles.genBtn}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={styles.genBtnText}>Generate Plan</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color="#F97316" size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Planning your LiveOps calendar…</Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {data && (
        <>
          {/* Seasonal calendar banner */}
          <View style={[styles.calendarBanner, { backgroundColor: "#7B2FFF18", borderColor: "#7B2FFF" }]}>
            <Feather name="calendar" size={14} color="#7B2FFF" />
            <Text style={[styles.calendarText, { color: "#7B2FFF" }]}>{data.seasonalCalendar}</Text>
          </View>

          {/* Launch announcement */}
          <View style={[styles.announcementCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.announcementHeader}>
              <Feather name="volume-2" size={16} color={colors.primary} />
              <Text style={[styles.announcementTitle, { color: colors.primary }]}>Launch Announcement</Text>
            </View>
            <Text style={[styles.announcementHeadline, { color: colors.foreground }]}>{data.announcement.title}</Text>
            <Text style={[styles.announcementBody, { color: colors.mutedForeground }]}>{data.announcement.body}</Text>
            <View style={[styles.ctaChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
              <Text style={[styles.ctaText, { color: colors.primary }]}>{data.announcement.cta}</Text>
            </View>
          </View>

          {/* Events */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduled Events</Text>
          {data.events.map((event, i) => {
            const col = EVENT_TYPE_COLOR[event.type] ?? colors.primary;
            const ico = EVENT_TYPE_ICON[event.type] ?? "star";
            const isExp = expandedEvent === i;
            return (
              <Pressable
                key={i}
                onPress={() => setExpandedEvent(isExp ? null : i)}
                style={[styles.eventCard, { backgroundColor: colors.card, borderColor: isExp ? col : colors.border }]}
              >
                <View style={styles.eventHeader}>
                  <View style={[styles.eventTypeChip, { backgroundColor: col + "20" }]}>
                    <Feather name={ico as any} size={12} color={col} />
                    <Text style={[styles.eventTypeText, { color: col }]}>{event.type}</Text>
                  </View>
                  <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.eventName, { color: colors.foreground }]}>{event.name}</Text>
                <View style={styles.eventMeta}>
                  <Feather name="clock" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>{event.duration}</Text>
                  <Feather name="calendar" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>{event.startDate}</Text>
                </View>
                {isExp && (
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventDesc, { color: colors.mutedForeground }]}>{event.description}</Text>
                    <Text style={[styles.rewardsLabel, { color: colors.foreground }]}>Rewards</Text>
                    {event.rewards.map((r, ri) => (
                      <View key={ri} style={styles.rewardRow}>
                        <Feather name="gift" size={12} color={col} />
                        <Text style={[styles.rewardText, { color: colors.mutedForeground }]}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* Daily rewards */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>7-Day Login Rewards</Text>
          <View style={[styles.dailyGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {data.dailyRewards.map((dr, i) => (
              <View key={i} style={[styles.dayCard, { backgroundColor: colors.background ?? "#0A0A0F", borderColor: colors.border }]}>
                <Text style={[styles.dayNum, { color: colors.mutedForeground }]}>Day {dr.day}</Text>
                <View style={[styles.dayIcon, { backgroundColor: "#FBBF2420" }]}>
                  <Feather name={dr.icon as any} size={18} color="#FBBF24" />
                </View>
                <Text style={[styles.dayReward, { color: colors.foreground }]} numberOfLines={2}>{dr.reward}</Text>
              </View>
            ))}
          </View>

          {/* Push notifications */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Push Notifications</Text>
          {data.pushNotifications.map((n, i) => (
            <View key={i} style={[styles.pushCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.pushHeader}>
                <Feather name="bell" size={14} color="#2B7FFF" />
                <Text style={[styles.pushTitle, { color: colors.foreground }]}>{n.title}</Text>
              </View>
              <Text style={[styles.pushBody, { color: colors.mutedForeground }]}>{n.body}</Text>
              <View style={[styles.triggerChip, { backgroundColor: "#2B7FFF18" }]}>
                <Feather name="clock" size={11} color="#2B7FFF" />
                <Text style={[styles.triggerText, { color: "#2B7FFF" }]}>{n.trigger}</Text>
              </View>
            </View>
          ))}

          {/* Regenerate */}
          <Pressable
            onPress={generate}
            style={[styles.regenBtn, { borderColor: "#F97316" }]}
          >
            <Feather name="refresh-cw" size={14} color="#F97316" />
            <Text style={[styles.regenText, { color: "#F97316" }]}>Regenerate Plan</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:                { gap: 12 },
  headerCard:          { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:          { gap: 2 },
  headerTitle:         { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:           { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyCard:           { alignItems: "center", gap: 12, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyTitle:          { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText:           { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  genBtn:              { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#F97316" },
  genBtnText:          { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadingCard:         { alignItems: "center", gap: 12, padding: 40, borderRadius: 14, borderWidth: 1 },
  loadingText:         { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorBanner:         { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:           { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  calendarBanner:      { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  calendarText:        { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 18 },
  announcementCard:    { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  announcementHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  announcementTitle:   { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  announcementHeadline:{ fontSize: 16, fontFamily: "Inter_700Bold" },
  announcementBody:    { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  ctaChip:             { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  ctaText:             { fontSize: 13, fontFamily: "Inter_700Bold" },
  sectionTitle:        { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 4 },
  eventCard:           { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  eventHeader:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eventTypeChip:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eventTypeText:       { fontSize: 11, fontFamily: "Inter_700Bold" },
  eventName:           { fontSize: 15, fontFamily: "Inter_700Bold" },
  eventMeta:           { flexDirection: "row", alignItems: "center", gap: 6 },
  eventMetaText:       { fontSize: 11, fontFamily: "Inter_400Regular" },
  eventDetails:        { gap: 8, paddingTop: 4 },
  eventDesc:           { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  rewardsLabel:        { fontSize: 12, fontFamily: "Inter_700Bold" },
  rewardRow:           { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardText:          { fontSize: 12, fontFamily: "Inter_400Regular" },
  dailyGrid:           { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayCard:             { width: "12%", minWidth: 44, alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, padding: 8 },
  dayNum:              { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  dayIcon:             { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dayReward:           { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  pushCard:            { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  pushHeader:          { flexDirection: "row", alignItems: "center", gap: 8 },
  pushTitle:           { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  pushBody:            { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  triggerChip:         { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  triggerText:         { fontSize: 11, fontFamily: "Inter_500Medium" },
  regenBtn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  regenText:           { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
