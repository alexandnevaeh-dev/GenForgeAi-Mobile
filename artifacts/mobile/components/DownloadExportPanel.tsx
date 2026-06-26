import { Feather } from "@expo/vector-icons";
import { Directory, DownloadTask, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Target = {
  id: string;
  label: string;
  description: string;
  icon: string;
  accentColor: string;
  files: string[];
};

const TARGETS: Target[] = [
  {
    id: "godot",
    label: "Godot 4.x",
    description: "GDScript, project.godot, scene scaffolding",
    icon: "box",
    accentColor: "#478CBF",
    files: ["project.godot", "scenes/", "scripts/", "assets/", "game-data.json", "README.md"],
  },
  {
    id: "phaser",
    label: "Phaser / HTML5",
    description: "index.html, Phaser 3 bootstrap, game-data.json",
    icon: "globe",
    accentColor: "#22C55E",
    files: ["index.html", "src/", "assets/", "game-data.json", "README.md"],
  },
  {
    id: "unity",
    label: "Unity",
    description: "C# GameData.cs scaffold, asset folder structure",
    icon: "layers",
    accentColor: "#AAAAAA",
    files: ["Scripts/GameData.cs", "Assets/", "game-data.json", "README.md"],
  },
  {
    id: "generic",
    label: "Generic / JSON",
    description: "Full design doc + all AI data + generated images",
    icon: "file-text",
    accentColor: "#7B2FFF",
    files: ["game-data.json", "assets/", "README.md"],
  },
];

interface Props {
  projectId: string;
  projectTitle: string;
  progress: number;
}

export function DownloadExportPanel({ projectId, projectTitle, progress }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  const canExport = progress >= 50;

  const handleDownload = async (target: Target) => {
    if (!accessToken) {
      Alert.alert("Sign In Required", "Please sign in to download exports.");
      return;
    }
    if (!canExport) {
      Alert.alert("Not Ready", "Generate at least 50% of the project before exporting.");
      return;
    }

    setDownloading(target.id);
    try {
      const url = `/api/projects/${projectId}/export?target=${target.id}`;
      const slug = projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const filename = `${slug}-${target.id}-export.zip`;

      if (Platform.OS === "web") {
        // Web: fetch → blob → anchor download
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objUrl);
      } else {
        // Native: expo-file-system v56 DownloadTask → expo-sharing
        const destFile = new File(Paths.cache, filename);
        const task = new DownloadTask(url, destFile, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const downloaded = await task.downloadAsync();
        if (!downloaded) throw new Error("Download was cancelled");

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloaded.uri, {
            mimeType: "application/zip",
            dialogTitle: `Export — ${projectTitle}`,
            UTI: "public.zip-archive",
          });
        } else {
          Alert.alert("Downloaded", `Saved to cache: ${filename}`);
        }
      }

      setLastDownloaded(target.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      Alert.alert("Export Error", msg);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* Readiness banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: canExport ? colors.success + "15" : colors.warning + "15",
            borderColor: canExport ? colors.success : colors.warning,
          },
        ]}
      >
        <Feather
          name={canExport ? "check-circle" : "alert-circle"}
          size={14}
          color={canExport ? colors.success : colors.warning}
        />
        <Text style={[styles.bannerText, { color: canExport ? colors.success : colors.warning }]}>
          {canExport
            ? `Export ready · ${progress}% generated · ${projectTitle}`
            : `Generate at least 50% to unlock exports · currently ${progress}%`}
        </Text>
      </View>

      {/* Target cards */}
      <View style={styles.grid}>
        {TARGETS.map((target) => {
          const isDownloading = downloading === target.id;
          const wasDone = lastDownloaded === target.id;
          const disabled = !canExport || downloading !== null;

          return (
            <View
              key={target.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: wasDone ? target.accentColor : colors.border,
                  opacity: disabled && !isDownloading ? 0.55 : 1,
                },
              ]}
            >
              {/* Icon + label */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: target.accentColor + "22" }]}>
                  <Feather name={target.icon as any} size={18} color={target.accentColor} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, { color: colors.foreground }]}>{target.label}</Text>
                  <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {target.description}
                  </Text>
                </View>
              </View>

              {/* File list */}
              <View style={styles.fileList}>
                {target.files.map((f) => (
                  <View key={f} style={styles.fileRow}>
                    <Feather
                      name={f.endsWith("/") ? "folder" : "file"}
                      size={10}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.fileName, { color: colors.mutedForeground }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* Download button */}
              <Pressable
                onPress={() => handleDownload(target)}
                disabled={disabled}
                style={[
                  styles.downloadBtn,
                  {
                    backgroundColor: wasDone ? target.accentColor + "22" : target.accentColor,
                    borderColor: target.accentColor,
                  },
                ]}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={wasDone ? target.accentColor : "#fff"} />
                ) : (
                  <>
                    <Feather
                      name={wasDone ? "check" : "download"}
                      size={13}
                      color={wasDone ? target.accentColor : "#fff"}
                    />
                    <Text
                      style={[
                        styles.downloadBtnText,
                        { color: wasDone ? target.accentColor : "#fff" },
                      ]}
                    >
                      {wasDone ? "Downloaded" : "Download ZIP"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* What's included note */}
      <View style={[styles.includesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.includesTitle, { color: colors.mutedForeground }]}>EVERY EXPORT INCLUDES</Text>
        {[
          { icon: "file-text", label: "Full game design document (README.md)" },
          { icon: "database", label: "All AI-generated JSON data — story, world, characters, combat" },
          { icon: "image", label: "Generated artwork — cover, characters, bosses, environments" },
          { icon: "code", label: "Engine-specific scaffolding files" },
        ].map((item) => (
          <View key={item.label} style={styles.includesRow}>
            <Feather name={item.icon as any} size={12} color={colors.primary} />
            <Text style={[styles.includesText, { color: colors.foreground }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  bannerText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  fileList: { gap: 4 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  fileName: { fontSize: 10, fontFamily: "Inter_400Regular" },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
  },
  downloadBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  includesCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  includesTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  includesRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  includesText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
});
