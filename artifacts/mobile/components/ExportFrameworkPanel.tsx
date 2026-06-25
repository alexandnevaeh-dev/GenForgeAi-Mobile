import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  BUILD_HISTORY,
  BUILD_VALIDATION,
  CODE_SYSTEMS,
  DOCUMENTATION,
  EXPORT_TARGETS,
  HEALTH_CATEGORIES,
  PROJECT_STRUCTURE,
  QA_STAGES,
  REVERSE_FORGE_CAPABILITIES,
  SAVE_SYSTEMS,
  SETTINGS_MANIFEST,
  TEST_SUITES,
  type ExportTarget,
  type HealthGrade,
  type ValidationStatus,
} from "@/constants/export-framework";
import { useColors } from "@/hooks/useColors";

type ExportTab = "targets" | "code" | "build" | "save" | "docs" | "health";

const EXPORT_TABS: { id: ExportTab; label: string; icon: string }[] = [
  { id: "targets", label: "Targets", icon: "upload" },
  { id: "code", label: "Code Gen", icon: "code" },
  { id: "build", label: "Build & QA", icon: "check-circle" },
  { id: "save", label: "Save", icon: "save" },
  { id: "docs", label: "Docs", icon: "book-open" },
  { id: "health", label: "Health", icon: "activity" },
];

const STATUS_COLORS: Record<ValidationStatus, string> = {
  pass: "#22C55E",
  warn: "#F97316",
  fail: "#EF4444",
  pending: "#6B6B80",
};

const TARGET_STATUS_COLORS: Record<string, string> = {
  official: "#22C55E",
  supported: "#2B7FFF",
  beta: "#F97316",
  planned: "#6B6B80",
};

const GRADE_COLORS: Record<HealthGrade, string> = {
  A: "#22C55E",
  B: "#2B7FFF",
  C: "#F97316",
  D: "#EF4444",
  F: "#7B2FFF",
};

function SectionHeader({
  title, icon, expanded, onToggle, badge,
}: {
  title: string; icon: string; expanded: boolean; onToggle: () => void; badge?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.secHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Feather name={icon as any} size={14} color={colors.accent} />
      <Text style={[styles.secTitle, { color: colors.foreground }]}>{title}</Text>
      {badge && (
        <View style={[styles.secBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.secBadgeText, { color: colors.primary }]}>{badge}</Text>
        </View>
      )}
      <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ─── Targets Tab ──────────────────────────────────────────────────────────
function TargetsTab() {
  const colors = useColors();
  const [selectedTarget, setSelectedTarget] = useState<string>("unity");
  const [buildQueue, setBuildQueue] = useState<string[]>([]);
  const target = EXPORT_TARGETS.find((t) => t.id === selectedTarget)!;

  const toggleQueue = (id: string) =>
    setBuildQueue((q) => q.includes(id) ? q.filter((x) => x !== id) : [...q, id]);

  const phases = [1, 2, 3] as const;
  const phaseLabels = { 1: "Phase 1 — Official", 2: "Phase 2 — Supported", 3: "Phase 3 — Platform" };

  return (
    <View style={styles.tabContent}>
      {/* Active export banner */}
      <View style={[styles.activeBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
        <Feather name="zap" size={14} color={colors.primary} />
        <View style={styles.activeBannerBody}>
          <Text style={[styles.activeBannerLabel, { color: colors.primary }]}>ACTIVE EXPORT TARGETS</Text>
          <Text style={[styles.activeBannerValue, { color: colors.foreground }]}>Unity 2022 LTS · Godot 4.x</Text>
        </View>
        <Pressable style={[styles.exportBtn, { backgroundColor: colors.primary }]}>
          <Feather name="upload" size={12} color="#fff" />
          <Text style={styles.exportBtnText}>Export Now</Text>
        </Pressable>
      </View>

      {/* Phase groups */}
      {phases.map((phase) => {
        const targets = EXPORT_TARGETS.filter((t) => t.phase === phase);
        return (
          <View key={phase} style={styles.phaseGroup}>
            <Text style={[styles.phaseGroupLabel, { color: colors.mutedForeground }]}>{phaseLabels[phase].toUpperCase()}</Text>
            {targets.map((t) => {
              const statusColor = TARGET_STATUS_COLORS[t.status];
              const isSelected = selectedTarget === t.id;
              const inQueue = buildQueue.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedTarget(t.id)}
                  style={[styles.targetCard, {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  }]}
                >
                  <View style={styles.targetHeader}>
                    <View style={[styles.targetIcon, { backgroundColor: isSelected ? colors.primary + "22" : colors.muted }]}>
                      <Feather name={t.icon as any} size={16} color={isSelected ? colors.primary : colors.mutedForeground} />
                    </View>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetName, { color: colors.foreground }]}>{t.name}</Text>
                      <View style={[styles.statusChip, { backgroundColor: statusColor + "22" }]}>
                        <Text style={[styles.statusChipText, { color: statusColor }]}>{t.status}</Text>
                      </View>
                    </View>
                    <View style={styles.targetActions}>
                      <Text style={[styles.buildTime, { color: colors.mutedForeground }]}>{t.buildTime}</Text>
                      <Pressable
                        onPress={() => toggleQueue(t.id)}
                        style={[styles.queueBtn, {
                          backgroundColor: inQueue ? colors.primary : colors.muted,
                          borderColor: inQueue ? colors.primary : colors.border,
                        }]}
                      >
                        <Feather name={inQueue ? "check" : "plus"} size={11} color={inQueue ? "#fff" : colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.targetDetail}>
                      <Text style={[styles.targetDesc, { color: colors.mutedForeground }]}>{t.description}</Text>
                      <View style={styles.detailCols}>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailColLabel, { color: colors.mutedForeground }]}>FOLDER STRUCTURE</Text>
                          {t.folderStructure.map((f) => (
                            <View key={f} style={styles.folderRow}>
                              <Feather name="folder" size={10} color={colors.accent} />
                              <Text style={[styles.folderText, { color: colors.foreground }]}>{f}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailColLabel, { color: colors.mutedForeground }]}>CODE SYSTEMS</Text>
                          {t.codeGenSystems.map((s) => (
                            <View key={s} style={styles.codeSystemRow}>
                              <View style={[styles.codeSystemDot, { backgroundColor: colors.secondary }]} />
                              <Text style={[styles.codeSystemText, { color: colors.foreground }]}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.formatsRow}>
                        {t.fileFormats.map((f) => (
                          <View key={f} style={[styles.formatChip, { backgroundColor: colors.muted }]}>
                            <Text style={[styles.formatText, { color: colors.mutedForeground }]}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {/* Project structure tree */}
      <View style={[styles.structureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.structureLabel, { color: colors.mutedForeground }]}>UNIVERSAL PROJECT STRUCTURE</Text>
        {PROJECT_STRUCTURE[0].children?.map((node) => (
          <View key={node.name} style={styles.treeRow}>
            <Feather name={node.type === "folder" ? "folder" : "file-text"} size={12} color={node.type === "folder" ? colors.accent : colors.mutedForeground} />
            <Text style={[styles.treeName, { color: node.type === "folder" ? colors.foreground : colors.mutedForeground }]}>{node.name}</Text>
            {node.note && <Text style={[styles.treeNote, { color: colors.mutedForeground }]} numberOfLines={1}>{node.note}</Text>}
          </View>
        ))}
      </View>

      {/* Build history */}
      <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.historyLabel, { color: colors.mutedForeground }]}>BUILD HISTORY</Text>
        {BUILD_HISTORY.map((b) => {
          const bColor = b.status === "success" ? colors.success : b.status === "warning" ? colors.warning : colors.destructive;
          return (
            <View key={b.version + b.timestamp} style={[styles.historyRow, { borderTopColor: colors.border }]}>
              <View style={[styles.historyStatus, { backgroundColor: bColor + "22" }]}>
                <Feather name={b.status === "success" ? "check" : b.status === "warning" ? "alert-triangle" : "x"} size={11} color={bColor} />
              </View>
              <View style={styles.historyInfo}>
                <View style={styles.historyTop}>
                  <Text style={[styles.historyVersion, { color: colors.foreground }]}>{b.version}</Text>
                  <View style={[styles.historyTargetChip, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.historyTargetText, { color: colors.mutedForeground }]}>{b.target}</Text>
                  </View>
                </View>
                <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                  {b.timestamp} · {b.status === "failed" ? "Failed" : `${b.sizeMb} MB`} · {b.duration}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Code Gen Tab ─────────────────────────────────────────────────────────
function CodeGenTab() {
  const colors = useColors();
  const [expanded, setExpanded] = useState<string | null>("Character Controller");
  const toggle = (n: string) => setExpanded((p) => (p === n ? null : n));

  const totalLines = CODE_SYSTEMS.reduce((sum, s) => {
    const match = s.linesEstimate.match(/\d+/);
    return sum + (match ? parseInt(match[0]) : 0);
  }, 0);

  return (
    <View style={styles.tabContent}>
      {/* Summary */}
      <View style={[styles.codeSummary, { backgroundColor: colors.secondary + "12", borderColor: colors.secondary }]}>
        <Feather name="code" size={14} color={colors.secondary} />
        <View style={styles.codeSummaryBody}>
          <Text style={[styles.codeSummaryLabel, { color: colors.secondary }]}>CODE GENERATION SUMMARY</Text>
          <Text style={[styles.codeSummaryValue, { color: colors.foreground }]}>
            {CODE_SYSTEMS.length} systems · ~{totalLines.toLocaleString()}+ lines generated
          </Text>
          <Text style={[styles.codeSummarySub, { color: colors.mutedForeground }]}>
            SOLID principles · Fully documented · Modular · Extensible
          </Text>
        </View>
      </View>

      {/* Code systems */}
      {CODE_SYSTEMS.map((sys) => {
        const isExpanded = expanded === sys.name;
        return (
          <Pressable
            key={sys.name}
            onPress={() => toggle(sys.name)}
            style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.codeCardHeader}>
              <View style={[styles.codeIcon, { backgroundColor: colors.muted }]}>
                <Feather name="terminal" size={14} color={colors.accent} />
              </View>
              <View style={styles.codeInfo}>
                <Text style={[styles.codeName, { color: colors.foreground }]}>{sys.name}</Text>
                <Text style={[styles.codeMeta, { color: colors.mutedForeground }]}>
                  {sys.language} · {sys.linesEstimate}
                </Text>
              </View>
              <View style={styles.codeEngines}>
                {sys.engine.map((e) => (
                  <View key={e} style={[styles.engineChip, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.engineChipText, { color: colors.primary }]}>{e}</Text>
                  </View>
                ))}
              </View>
              <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
            </View>
            {isExpanded && (
              <View style={styles.codeBody}>
                <Text style={[styles.codeDesc, { color: colors.mutedForeground }]}>{sys.description}</Text>
                <Text style={[styles.codeFeaturesLabel, { color: colors.mutedForeground }]}>GENERATED FEATURES</Text>
                {sys.features.map((f, i) => (
                  <View key={i} style={styles.codeFeatureRow}>
                    <Feather name="check" size={11} color={colors.success} />
                    <Text style={[styles.codeFeatureText, { color: colors.foreground }]}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Build & QA Tab ───────────────────────────────────────────────────────
function BuildQATab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("qa");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const passCount = BUILD_VALIDATION.filter((v) => v.status === "pass").length;
  const warnCount = BUILD_VALIDATION.filter((v) => v.status === "warn").length;
  const failCount = BUILD_VALIDATION.filter((v) => v.status === "fail").length;

  const totalCoverage = Math.round(TEST_SUITES.reduce((s, t) => s + t.coverage, 0) / TEST_SUITES.length);

  return (
    <View style={styles.tabContent}>
      {/* QA Pipeline */}
      <SectionHeader title="QA Pipeline" icon="layers" expanded={openSection === "qa"} onToggle={() => toggle("qa")} badge="5 stages" />
      {openSection === "qa" && (
        <View style={styles.secBody}>
          {QA_STAGES.map((stage) => {
            const sc = STATUS_COLORS[stage.status];
            return (
              <View key={stage.order} style={[styles.qaStageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.qaStageNum, { backgroundColor: sc + "22" }]}>
                  <Text style={[styles.qaStageNumText, { color: sc }]}>{stage.order}</Text>
                </View>
                <View style={styles.qaStageBody}>
                  <View style={styles.qaStageHeader}>
                    <Feather name={stage.icon as any} size={13} color={sc} />
                    <Text style={[styles.qaStageName, { color: colors.foreground }]}>{stage.name}</Text>
                    <View style={[styles.qaStatusChip, { backgroundColor: sc + "22" }]}>
                      <Text style={[styles.qaStatusText, { color: sc }]}>{stage.status}</Text>
                    </View>
                    <Text style={[styles.qaDuration, { color: colors.mutedForeground }]}>{stage.duration}</Text>
                  </View>
                  <Text style={[styles.qaDesc, { color: colors.mutedForeground }]}>{stage.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Build Validation */}
      <SectionHeader title="Build Validation" icon="check-square" expanded={openSection === "validation"} onToggle={() => toggle("validation")} badge={`${BUILD_VALIDATION.length} checks`} />
      {openSection === "validation" && (
        <View style={styles.secBody}>
          <View style={styles.validationSummary}>
            {[
              { label: "Pass", count: passCount, color: colors.success },
              { label: "Warn", count: warnCount, color: colors.warning },
              { label: "Fail", count: failCount, color: colors.destructive },
            ].map((s) => (
              <View key={s.label} style={[styles.validStat, { backgroundColor: s.color + "22", borderColor: s.color }]}>
                <Text style={[styles.validStatCount, { color: s.color }]}>{s.count}</Text>
                <Text style={[styles.validStatLabel, { color: s.color }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          {["Static", "Logic", "Performance", "Dependencies", "Build"].map((cat) => {
            const checks = BUILD_VALIDATION.filter((v) => v.category === cat);
            return (
              <View key={cat} style={styles.validGroup}>
                <Text style={[styles.validGroupLabel, { color: colors.mutedForeground }]}>{cat.toUpperCase()}</Text>
                {checks.map((check) => {
                  const sc = STATUS_COLORS[check.status];
                  return (
                    <View key={check.name} style={[styles.validRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Feather name={check.status === "pass" ? "check-circle" : check.status === "warn" ? "alert-triangle" : "x-circle"} size={13} color={sc} />
                      <View style={styles.validInfo}>
                        <Text style={[styles.validName, { color: colors.foreground }]}>{check.name}</Text>
                        <Text style={[styles.validDetail, { color: colors.mutedForeground }]}>{check.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      {/* Test automation */}
      <SectionHeader title="Test Automation" icon="play-circle" expanded={openSection === "tests"} onToggle={() => toggle("tests")} badge={`${totalCoverage}% avg coverage`} />
      {openSection === "tests" && (
        <View style={styles.secBody}>
          {TEST_SUITES.map((suite) => {
            const sc = STATUS_COLORS[suite.status];
            return (
              <View key={suite.system} style={[styles.testCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.testHeader}>
                  <View style={[styles.testIcon, { backgroundColor: sc + "22" }]}>
                    <Feather name={suite.icon as any} size={13} color={sc} />
                  </View>
                  <Text style={[styles.testSystem, { color: colors.foreground }]}>{suite.system}</Text>
                  <View style={[styles.coverageBadge, { backgroundColor: sc + "22" }]}>
                    <Text style={[styles.coverageText, { color: sc }]}>{suite.coverage}%</Text>
                  </View>
                </View>
                <View style={[styles.testPbBg, { backgroundColor: colors.muted }]}>
                  <View style={[styles.testPbFill, { backgroundColor: sc, width: `${suite.coverage}%` as any }]} />
                </View>
                {suite.tests.map((t, i) => (
                  <View key={i} style={styles.testCaseRow}>
                    <Feather name={suite.status === "warn" && i > 3 ? "alert-circle" : "check"} size={10} color={suite.status === "warn" && i > 3 ? colors.warning : colors.success} />
                    <Text style={[styles.testCaseText, { color: colors.mutedForeground }]}>{t}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Save Tab ─────────────────────────────────────────────────────────────
function SaveTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("saves");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  return (
    <View style={styles.tabContent}>
      {/* Save systems */}
      <SectionHeader title="Save Systems" icon="save" expanded={openSection === "saves"} onToggle={() => toggle("saves")} badge="4 types" />
      {openSection === "saves" && (
        <View style={styles.secBody}>
          {SAVE_SYSTEMS.map((sys) => {
            const sysColor = sys.type === "auto" ? colors.primary : sys.type === "manual" ? colors.success : sys.type === "cloud" ? colors.accent : colors.secondary;
            return (
              <View key={sys.type} style={[styles.saveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.saveHeader}>
                  <View style={[styles.saveIcon, { backgroundColor: sysColor + "22" }]}>
                    <Feather name={sys.icon as any} size={15} color={sysColor} />
                  </View>
                  <View style={styles.saveInfo}>
                    <Text style={[styles.saveName, { color: colors.foreground }]}>{sys.label}</Text>
                    <Text style={[styles.saveDesc, { color: colors.mutedForeground }]}>{sys.description}</Text>
                  </View>
                </View>
                <View style={styles.saveTracks}>
                  {sys.tracks.map((t) => (
                    <View key={t} style={[styles.trackTag, { backgroundColor: sysColor + "15", borderColor: sysColor }]}>
                      <Text style={[styles.trackTagText, { color: sysColor }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Settings */}
      <SectionHeader title="Settings Manifest" icon="sliders" expanded={openSection === "settings"} onToggle={() => toggle("settings")} badge={`${SETTINGS_MANIFEST.length} categories`} />
      {openSection === "settings" && (
        <View style={styles.secBody}>
          {SETTINGS_MANIFEST.map((cat) => (
            <View key={cat.name} style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingHeader}>
                <Feather name={cat.icon as any} size={14} color={colors.accent} />
                <Text style={[styles.settingName, { color: colors.foreground }]}>{cat.name}</Text>
                <Text style={[styles.settingCount, { color: colors.mutedForeground }]}>{cat.options.length} options</Text>
              </View>
              <View style={styles.settingOptions}>
                {cat.options.map((opt) => (
                  <View key={opt} style={[styles.settingOption, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.settingOptionText, { color: colors.mutedForeground }]}>{opt}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Input support */}
      <SectionHeader title="Input System" icon="gamepad-2" expanded={openSection === "input"} onToggle={() => toggle("input")} badge="5 devices" />
      {openSection === "input" && (
        <View style={styles.secBody}>
          {[
            { device: "Keyboard & Mouse", icon: "monitor", desc: "Full rebinding, modifier support, macro detection" },
            { device: "Controller", icon: "gamepad-2", desc: "Xbox, PlayStation, Switch Pro, 8BitDo — auto-detected" },
            { device: "Touchscreen", icon: "smartphone", desc: "Virtual joystick, tap-to-move, gesture support" },
            { device: "Accessibility Devices", icon: "eye", desc: "Switch access, eye-tracking hooks, single-button mode" },
            { device: "Keyboard (Accessibility)", icon: "type", desc: "Full game playable with keyboard only — all actions mapped" },
          ].map((inp) => (
            <View key={inp.device} style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.inputIcon, { backgroundColor: colors.muted }]}>
                <Feather name={inp.icon as any} size={14} color={colors.accent} />
              </View>
              <View style={styles.inputBody}>
                <Text style={[styles.inputDevice, { color: colors.foreground }]}>{inp.device}</Text>
                <Text style={[styles.inputDesc, { color: colors.mutedForeground }]}>{inp.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Docs Tab ─────────────────────────────────────────────────────────────
function DocsTab() {
  const colors = useColors();
  const [expanded, setExpanded] = useState<string | null>("Game Design Document");
  const toggle = (t: string) => setExpanded((p) => (p === t ? null : t));

  const typeColor = (type: string) =>
    type === "gdd" ? colors.primary : type === "tdd" ? colors.secondary : colors.success;
  const typeLabel = (type: string) =>
    type === "gdd" ? "GDD" : type === "tdd" ? "TDD" : "GUIDE";

  return (
    <View style={styles.tabContent}>
      {/* Doc overview */}
      <View style={[styles.docOverview, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.docOverviewLabel, { color: colors.mutedForeground }]}>GENERATED DOCUMENTATION</Text>
        <View style={styles.docOverviewStats}>
          {DOCUMENTATION.map((doc) => (
            <View key={doc.type} style={styles.docStat}>
              <Text style={[styles.docStatPages, { color: typeColor(doc.type) }]}>{doc.pages}</Text>
              <Text style={[styles.docStatLabel, { color: colors.mutedForeground }]}>{typeLabel(doc.type)} pages</Text>
            </View>
          ))}
          <View style={styles.docStat}>
            <Text style={[styles.docStatPages, { color: colors.foreground }]}>{DOCUMENTATION.reduce((s, d) => s + d.pages, 0)}</Text>
            <Text style={[styles.docStatLabel, { color: colors.mutedForeground }]}>Total pages</Text>
          </View>
        </View>
      </View>

      {/* Document sections */}
      {DOCUMENTATION.map((doc) => {
        const isExpanded = expanded === doc.title;
        const dc = typeColor(doc.type);
        return (
          <Pressable
            key={doc.type}
            onPress={() => toggle(doc.title)}
            style={[styles.docCard, { backgroundColor: colors.card, borderColor: isExpanded ? dc : colors.border, borderWidth: isExpanded ? 1.5 : 1 }]}
          >
            <View style={styles.docCardHeader}>
              <View style={[styles.docTypeChip, { backgroundColor: dc + "22" }]}>
                <Text style={[styles.docTypeText, { color: dc }]}>{typeLabel(doc.type)}</Text>
              </View>
              <Feather name={doc.icon as any} size={14} color={dc} />
              <Text style={[styles.docTitle, { color: colors.foreground }]}>{doc.title}</Text>
              <Text style={[styles.docPages, { color: colors.mutedForeground }]}>{doc.pages}p</Text>
              <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
            </View>
            {isExpanded && (
              <View style={styles.docBody}>
                {doc.sections.map((sec, i) => (
                  <View key={i} style={styles.docSectionRow}>
                    <Text style={[styles.docSectionNum, { color: dc }]}>{String(i + 1).padStart(2, "0")}</Text>
                    <Text style={[styles.docSectionName, { color: colors.foreground }]}>{sec}</Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Localization framework note */}
      <View style={[styles.locFramework, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="globe" size={13} color={colors.accent} />
        <Text style={[styles.locFrameworkText, { color: colors.mutedForeground }]}>
          Localization framework included — translation tables, dialogue DB, and UI text DB. New languages add without code rewrites.
        </Text>
      </View>
    </View>
  );
}

// ─── Health + Reverse Forge Tab ────────────────────────────────────────────
function HealthTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("score");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const overall = Math.round(HEALTH_CATEGORIES.reduce((s, c) => s + c.score, 0) / HEALTH_CATEGORIES.length);
  const overallGrade: HealthGrade = overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "F";
  const overallColor = GRADE_COLORS[overallGrade];

  return (
    <View style={styles.tabContent}>
      {/* Overall score */}
      <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.overallCircle, { borderColor: overallColor }]}>
          <Text style={[styles.overallScore, { color: overallColor }]}>{overall}</Text>
          <Text style={[styles.overallMax, { color: colors.mutedForeground }]}>/100</Text>
        </View>
        <View style={styles.overallInfo}>
          <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>PROJECT HEALTH SCORE</Text>
          <View style={[styles.overallGradeBadge, { backgroundColor: overallColor + "22" }]}>
            <Text style={[styles.overallGradeText, { color: overallColor }]}>Grade {overallGrade} — {overall >= 90 ? "Excellent" : overall >= 80 ? "Good" : "Needs Work"}</Text>
          </View>
          <Text style={[styles.overallSub, { color: colors.mutedForeground }]}>Across 6 health dimensions</Text>
        </View>
      </View>

      {/* Health categories */}
      <SectionHeader title="Health Categories" icon="activity" expanded={openSection === "score"} onToggle={() => toggle("score")} badge="6 dimensions" />
      {openSection === "score" && (
        <View style={styles.secBody}>
          {HEALTH_CATEGORIES.map((cat) => {
            const gc = GRADE_COLORS[cat.grade];
            return (
              <View key={cat.name} style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.healthHeader}>
                  <View style={[styles.healthIcon, { backgroundColor: gc + "22" }]}>
                    <Feather name={cat.icon as any} size={14} color={gc} />
                  </View>
                  <Text style={[styles.healthName, { color: colors.foreground }]}>{cat.name}</Text>
                  <View style={[styles.healthGrade, { backgroundColor: gc + "22" }]}>
                    <Text style={[styles.healthGradeText, { color: gc }]}>{cat.grade}</Text>
                  </View>
                  <Text style={[styles.healthScore, { color: gc }]}>{cat.score}</Text>
                </View>
                <View style={[styles.healthPbBg, { backgroundColor: colors.muted }]}>
                  <View style={[styles.healthPbFill, { backgroundColor: gc, width: `${cat.score}%` as any }]} />
                </View>
                {cat.details.map((d, i) => (
                  <View key={i} style={styles.healthDetailRow}>
                    <Feather name={d.startsWith("0 ") || d.includes("verified") || d.includes("complete") || d.includes("passed") ? "check" : "alert-circle"} size={10}
                      color={d.startsWith("0 ") || d.includes("verified") || d.includes("complete") || d.includes("passed") ? colors.success : colors.warning}
                    />
                    <Text style={[styles.healthDetail, { color: colors.mutedForeground }]}>{d}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {/* Reverse Forge */}
      <SectionHeader title="Reverse Forge" icon="download" expanded={openSection === "reverse"} onToggle={() => toggle("reverse")} badge="Exclusive" />
      {openSection === "reverse" && (
        <View style={styles.secBody}>
          <View style={[styles.reverseBanner, { backgroundColor: colors.warning + "12", borderColor: colors.warning }]}>
            <Feather name="download" size={14} color={colors.warning} />
            <View style={styles.reverseBannerBody}>
              <Text style={[styles.reverseBannerLabel, { color: colors.warning }]}>GENFORGEAI EXCLUSIVE — REVERSE FORGE</Text>
              <Text style={[styles.reverseBannerDesc, { color: colors.foreground }]}>
                Import any existing Unity, Godot, Unreal, or GameMaker project. Reverse Forge reads its structure, identifies systems, generates missing docs, and suggests improvements using AI.
              </Text>
            </View>
          </View>

          {REVERSE_FORGE_CAPABILITIES.map((cap) => (
            <View key={cap.capability} style={[styles.reverseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reverseHeader}>
                <View style={[styles.reverseIcon, { backgroundColor: colors.warning + "22" }]}>
                  <Feather name={cap.icon as any} size={14} color={colors.warning} />
                </View>
                <View style={styles.reverseInfo}>
                  <Text style={[styles.reverseName, { color: colors.foreground }]}>{cap.capability}</Text>
                  <Text style={[styles.reverseDesc, { color: colors.mutedForeground }]}>{cap.description}</Text>
                </View>
              </View>
              <View style={styles.reverseEngines}>
                {cap.supported.map((e) => (
                  <View key={e} style={[styles.reverseEngineChip, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.reverseEngineText, { color: colors.mutedForeground }]}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Autonomous Studio Mode teaser */}
          <View style={[styles.autonomousBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
            <Feather name="cpu" size={16} color={colors.primary} />
            <View style={styles.autonomousBody}>
              <Text style={[styles.autonomousLabel, { color: colors.primary }]}>AUTONOMOUS STUDIO MODE — COMING SOON</Text>
              <Text style={[styles.autonomousPrompt, { color: colors.foreground }]}>
                "Create and export a complete Metroidvania inspired by Hollow Knight and Castlevania."
              </Text>
              <Text style={[styles.autonomousDesc, { color: colors.mutedForeground }]}>
                GenForgeAI plans, builds, tests, packages, and ships — with minimal user intervention.
              </Text>
              <View style={styles.autonomousSteps}>
                {["Plan project", "Create world", "Build systems", "Generate assets", "Test gameplay", "Package export", "Produce docs"].map((step, i) => (
                  <View key={i} style={[styles.autonomousStep, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.autonomousStepNum, { color: colors.primary }]}>{i + 1}</Text>
                    <Text style={[styles.autonomousStepText, { color: colors.foreground }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function ExportFrameworkPanel() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<ExportTab>("targets");

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.muted }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {EXPORT_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && [styles.tabActive, { backgroundColor: colors.card }]]}
          >
            <Feather name={tab.icon as any} size={13} color={activeTab === tab.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === "targets" && <TargetsTab />}
      {activeTab === "code" && <CodeGenTab />}
      {activeTab === "build" && <BuildQATab />}
      {activeTab === "save" && <SaveTab />}
      {activeTab === "docs" && <DocsTab />}
      {activeTab === "health" && <HealthTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  tabBar: { borderRadius: 12, flexGrow: 0 },
  tabBarContent: { padding: 3, gap: 2, flexDirection: "row" },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9 },
  tabActive: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabContent: { gap: 10 },
  secHeader: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 11, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  secTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  secBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  secBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  secBody: { gap: 8, paddingLeft: 4 },
  // Targets
  activeBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  activeBannerBody: { flex: 1 },
  activeBannerLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  activeBannerValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  exportBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  phaseGroup: { gap: 6 },
  phaseGroupLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  targetCard: { borderRadius: 12, overflow: "hidden" },
  targetHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  targetIcon: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  targetInfo: { flex: 1, gap: 4 },
  targetName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statusChip: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  statusChipText: { fontSize: 9, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  targetActions: { alignItems: "flex-end", gap: 5 },
  buildTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  queueBtn: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  targetDetail: { paddingHorizontal: 12, paddingBottom: 14, gap: 10 },
  targetDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  detailCols: { flexDirection: "row", gap: 12 },
  detailCol: { flex: 1, gap: 5 },
  detailColLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 2 },
  folderRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  folderText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  codeSystemRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  codeSystemDot: { width: 5, height: 5, borderRadius: 3 },
  codeSystemText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  formatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  formatChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  formatText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  structureCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 5 },
  structureLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  treeRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 2 },
  treeName: { fontSize: 12, fontFamily: "Inter_500Medium", width: 120 },
  treeNote: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular" },
  historyCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 0 },
  historyLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  historyStatus: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  historyInfo: { flex: 1 },
  historyTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyVersion: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  historyTargetChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  historyTargetText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  historyMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Code Gen
  codeSummary: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  codeSummaryBody: { flex: 1, gap: 3 },
  codeSummaryLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  codeSummaryValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  codeSummarySub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  codeCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  codeCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  codeIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  codeInfo: { flex: 1 },
  codeName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  codeMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  codeEngines: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  engineChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  engineChipText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  codeBody: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  codeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  codeFeaturesLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  codeFeatureRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  codeFeatureText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  // Build & QA
  qaStageCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  qaStageNum: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  qaStageNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  qaStageBody: { flex: 1, gap: 5 },
  qaStageHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  qaStageName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  qaStatusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  qaStatusText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  qaDuration: { fontSize: 11, fontFamily: "Inter_400Regular" },
  qaDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  validationSummary: { flexDirection: "row", gap: 10 },
  validStat: { flex: 1, alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 10, gap: 2 },
  validStatCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  validStatLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  validGroup: { gap: 5 },
  validGroupLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  validRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  validInfo: { flex: 1 },
  validName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  validDetail: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 2 },
  testCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  testHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  testIcon: { width: 32, height: 32, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  testSystem: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  coverageBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  coverageText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  testPbBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  testPbFill: { height: 5, borderRadius: 3 },
  testCaseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  testCaseText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Save
  saveCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  saveHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  saveIcon: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  saveInfo: { flex: 1, gap: 4 },
  saveName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  saveTracks: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  trackTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  trackTagText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  settingCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  settingHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  settingCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  settingOptions: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  settingOption: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  settingOptionText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  inputIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  inputBody: { flex: 1 },
  inputDevice: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Docs
  docOverview: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  docOverviewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  docOverviewStats: { flexDirection: "row", justifyContent: "space-around" },
  docStat: { alignItems: "center", gap: 2 },
  docStatPages: { fontSize: 24, fontFamily: "Inter_700Bold" },
  docStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  docCard: { borderRadius: 12, overflow: "hidden" },
  docCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14 },
  docTypeChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  docTypeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  docTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  docPages: { fontSize: 11, fontFamily: "Inter_400Regular" },
  docBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  docSectionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  docSectionNum: { fontSize: 11, fontFamily: "Inter_700Bold", width: 22 },
  docSectionName: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  locFramework: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  locFrameworkText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
  // Health
  overallCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  overallCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  overallScore: { fontSize: 28, fontFamily: "Inter_700Bold" },
  overallMax: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },
  overallInfo: { flex: 1, gap: 6 },
  overallLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  overallGradeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  overallGradeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  overallSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  healthCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 7 },
  healthHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthIcon: { width: 32, height: 32, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  healthName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  healthGrade: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  healthGradeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  healthScore: { fontSize: 20, fontFamily: "Inter_700Bold", width: 36, textAlign: "right" },
  healthPbBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  healthPbFill: { height: 5, borderRadius: 3 },
  healthDetailRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  healthDetail: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  // Reverse Forge
  reverseBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  reverseBannerBody: { flex: 1, gap: 4 },
  reverseBannerLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  reverseBannerDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  reverseCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  reverseHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reverseIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  reverseInfo: { flex: 1, gap: 3 },
  reverseName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reverseDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  reverseEngines: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  reverseEngineChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  reverseEngineText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  autonomousBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  autonomousBody: { flex: 1, gap: 8 },
  autonomousLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  autonomousPrompt: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19, fontStyle: "italic" },
  autonomousDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  autonomousSteps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  autonomousStep: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  autonomousStepNum: { fontSize: 10, fontFamily: "Inter_700Bold" },
  autonomousStepText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
