import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getCase, getSimilarCases, type CaseDetail, type SearchResult } from "@/api/client";

const colors = {
  primary: "#1e40af",
  primaryLight: "#eff6ff",
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  amber: "#92400e",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  error: "#dc2626",
};

function SkeletonBlock({ width, height, style }: { width: string | number; height: number; style?: object }) {
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: "#e2e8f0",
          borderRadius: 6,
        },
        style,
      ]}
    />
  );
}

function DetailSkeleton() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SkeletonBlock width="60%" height={24} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="40%" height={16} style={{ marginBottom: 24 }} />
      <SkeletonBlock width="100%" height={44} style={{ marginBottom: 24, borderRadius: 10 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ marginBottom: 20 }}>
          <SkeletonBlock width="30%" height={14} style={{ marginBottom: 10 }} />
          <SkeletonBlock width="100%" height={16} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="100%" height={16} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="70%" height={16} />
        </View>
      ))}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const caseId = Number(id);
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (isNaN(caseId)) {
      setError("Invalid case ID");
      setLoading(false);
      return;
    }
    try {
      const [c, s] = await Promise.all([getCase(caseId), getSimilarCases(caseId)]);
      setCaseData(c);
      setSimilar(s);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) return <DetailSkeleton />;

  if (error || !caseData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || "Case not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.errorBack}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <Text style={styles.title}>{caseData.case_name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{caseData.citation}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{caseData.year}</Text>
        {caseData.bench && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{caseData.bench}</Text>
          </>
        )}
      </View>

      {/* AI Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⓘ AI-generated summary. Always verify against the official judgment.
        </Text>
      </View>

      {/* Content Card */}
      <View style={styles.contentCard}>
        {caseData.facts && (
          <Section title="FACTS">
            <Text style={styles.body}>{caseData.facts}</Text>
          </Section>
        )}
        {caseData.legal_issues && (
          <Section title="LEGAL ISSUES">
            <Text style={styles.body}>{caseData.legal_issues}</Text>
          </Section>
        )}
        {caseData.judgment && (
          <Section title="JUDGMENT">
            <Text style={styles.body}>{caseData.judgment}</Text>
          </Section>
        )}
        {caseData.ratio_decidendi && (
          <Section title="RATIO DECIDENDI">
            <Text style={styles.body}>{caseData.ratio_decidendi}</Text>
          </Section>
        )}
        {caseData.key_principles && caseData.key_principles.length > 0 && (
          <Section title="KEY PRINCIPLES">
            {caseData.key_principles.map((p, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </Section>
        )}
      </View>

      {/* Source Link */}
      {caseData.source_url && (
        <TouchableOpacity
          style={styles.sourceButton}
          onPress={() => Linking.openURL(caseData.source_url!)}
          activeOpacity={0.7}
        >
          <Text style={styles.sourceButtonText}>View Official Judgment ↗</Text>
        </TouchableOpacity>
      )}

      {/* Similar Cases */}
      {similar.length > 0 && (
        <View style={styles.similarSection}>
          <Text style={styles.similarTitle}>Similar Cases</Text>
          {similar.map((r) => (
            <TouchableOpacity
              key={r.case.id}
              style={styles.similarCard}
              onPress={() => router.push(`/cases/${r.case.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.similarCardContent}>
                <Text style={styles.similarName} numberOfLines={1}>
                  {r.case.case_name}
                </Text>
                <Text style={styles.similarMeta}>
                  {r.case.citation} · {r.case.year}
                </Text>
              </View>
              {r.similarity != null && (
                <Text style={styles.similarPct}>{Math.round(r.similarity * 100)}%</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },

  title: { fontSize: 20, fontWeight: "700", color: colors.text, lineHeight: 28, marginBottom: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 16 },
  meta: { fontSize: 13, color: colors.textMuted },
  metaDot: { fontSize: 13, color: colors.textMuted, marginHorizontal: 6 },

  disclaimer: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  disclaimerText: { fontSize: 13, color: colors.amber, lineHeight: 18 },

  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  body: { fontSize: 15, lineHeight: 23, color: colors.text },
  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { fontSize: 15, color: colors.textMuted, marginRight: 8, lineHeight: 23 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 23, color: colors.text },

  sourceButton: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    marginBottom: 24,
  },
  sourceButtonText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  similarSection: { marginBottom: 16 },
  similarTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 },
  similarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  similarCardContent: { flex: 1 },
  similarName: { fontWeight: "500", fontSize: 14, color: colors.text, marginBottom: 3 },
  similarMeta: { fontSize: 12, color: colors.textMuted },
  similarPct: { fontSize: 13, color: colors.textMuted, fontWeight: "500", marginLeft: 12 },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
  errorBack: { fontSize: 15, fontWeight: "600", color: colors.primary },
});
