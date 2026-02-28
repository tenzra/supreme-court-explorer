import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getCase, getSimilarCases, type CaseDetail, type SearchResult } from "@/api/client";

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const caseId = Number(id);
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(caseId)) {
      setError("Invalid case ID");
      setLoading(false);
      return;
    }
    Promise.all([getCase(caseId), getSimilarCases(caseId)])
      .then(([c, s]) => {
        setCaseData(c);
        setSimilar(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error || !caseData) {
    return (
      <View style={styles.center}>
        <Text>{error || "Case not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{caseData.case_name}</Text>
      <Text style={styles.meta}>
        {caseData.citation} · {caseData.year}
        {caseData.bench && ` · ${caseData.bench}`}
      </Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>AI-generated summary. Verify with official judgment.</Text>
      </View>

      {caseData.facts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facts</Text>
          <Text style={styles.body}>{caseData.facts}</Text>
        </View>
      )}
      {caseData.legal_issues && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Issues</Text>
          <Text style={styles.body}>{caseData.legal_issues}</Text>
        </View>
      )}
      {caseData.judgment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Judgment</Text>
          <Text style={styles.body}>{caseData.judgment}</Text>
        </View>
      )}
      {caseData.ratio_decidendi && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratio Decidendi</Text>
          <Text style={styles.body}>{caseData.ratio_decidendi}</Text>
        </View>
      )}
      {caseData.key_principles && caseData.key_principles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Principles</Text>
          {caseData.key_principles.map((p, i) => (
            <Text key={i} style={[styles.body, styles.bullet]}>
              • {p}
            </Text>
          ))}
        </View>
      )}

      {caseData.source_url && (
        <TouchableOpacity onPress={() => Linking.openURL(caseData.source_url!)}>
          <Text style={styles.link}>View source</Text>
        </TouchableOpacity>
      )}

      {similar.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Similar Cases</Text>
          {similar.map((r) => (
            <TouchableOpacity
              key={r.case.id}
              style={styles.similarCard}
              onPress={() => router.push(`/cases/${r.case.id}`)}
            >
              <Text style={styles.similarName}>{r.case.case_name}</Text>
              <Text style={styles.similarMeta}>
                {r.case.citation} · {r.case.year}
                {r.similarity != null && ` · ${Math.round(r.similarity * 100)}% similar`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backLink: { marginBottom: 16 },
  backButton: { marginTop: 16, padding: 12 },
  backText: { color: "#2563eb", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  meta: { color: "#666", fontSize: 14, marginBottom: 16 },
  disclaimer: {
    padding: 12,
    marginBottom: 24,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
  },
  disclaimerText: { fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  body: { lineHeight: 24, fontSize: 15 },
  bullet: { marginBottom: 4 },
  link: { color: "#2563eb", fontSize: 14, marginBottom: 24 },
  similarCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  similarName: { fontWeight: "500", marginBottom: 4 },
  similarMeta: { fontSize: 13, color: "#666" },
});
